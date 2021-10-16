const express = require('express');
const http = require('http');
const serveStatic = require('serve-static');
const dirTree = require("directory-tree");
const path = require('path');
const bodyParser = require('body-parser');
const morgan = require("morgan")

let listenPort = 8080;
let rootPath = null;

async function init() {
    function exitWithUsage(argv) {
        console.log(
            'Usage: ' + argv[0] + ' ' + argv[1]
            + ' --root-path PATH'
            + ' [--port PORT]'
        );
        process.exit();
    }

    for (let i = 2; i < process.argv.length; i++) {
        switch (process.argv[i]) {
            case '--root-path':
                if (process.argv.length <= i + 1) {
                    exitWithUsage(process.argv);
                }
                rootPath = process.argv[++i];
                break;

            case '--port':
                if (process.argv.length <= i + 1) {
                    exitWithUsage(process.argv);
                }
                listenPort = parseInt(process.argv[++i]);
                break;

            default:
                console.log(process.argv[i]);
                exitWithUsage(process.argv);
                break;
        }
    }
    if (!rootPath) rootPath = path.resolve('.');
    const tree = dirTree(rootPath,
        {
            attributes: ["size", "type", "extension"],
            extensions: /\.(mp4|txt|html)$/,
            normalizePath: true
        }
    );
    try {
        await getHtmlContent(tree);
    } catch (e) {
        console.log(e.message);
    }
    initExpress();
}

function initExpress() {

    const app = express();
    const server = http.Server(app);

    app.use(bodyParser.urlencoded({extended: false}));

    // app.all('*', function (request, response, next) {
    //     console.log(request.url);
    //     next();
    // });

    app.use(morgan('common'))
    let convertPath = (windowsPath) => windowsPath.replace(/^\\\\\?\\/, "").replace(/\\/g, '\/').replace(/\/\/+/g, '\/')

    app.use('/', serveStatic(path.join(__dirname, 'static')));
    app.get("/tree", (req, res) => {
        const tree = dirTree(rootPath,
            {
                attributes: ["size", "type", "extension"],
                extensions: /\.(mp4|txt)$/,
                normalizePath: true
            }
        );
        res.json({
            data: tree,
            root_dir: convertPath(rootPath)
        });
    });

    app.use('/video-data/', serveStatic(rootPath));

    server.listen(listenPort);
    console.log('Listening to port', listenPort);
}

const fs = require('fs').promises;
const parse = require("node-html-parser").parse
const requestPromise = require("request-promise");

async function getHtmlContent(node) {
    if (node.type === "file") {
        if (node.extension === ".html") {
            // console.log(node)
            // Use fs.readFile() method to read the file
            let content = await fs.readFile(node.path, "utf-8");
            const root = parse(content);
            let script = root.getElementsByTagName("script")[0];
            if (script) {
                let link = script.textContent.split(" ")[2]
                    .replace(";", "")
                    .replace("\"", "")
                    .replace("\"", "");

                if (link.includes("download")) {
                    let fileName = node.path.replace(".html", "");
                    let err = fs.access(fileName, fs.F_OK);
                    if (err) {
                        let res = await requestPromise(link);
                        await fs.writeFile(fileName, res);
                        console.log(`write to file {} success`, fileName)
                    } else {
                        console.log(`file {} exist`, fileName);
                    }

                }
            }
        }
        return;
    }
    for (let child of node.children) {
        await getHtmlContent(child);
    }
}

(async () => init())();


