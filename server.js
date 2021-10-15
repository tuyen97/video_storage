const express = require('express');
const http = require('http');
const serveStatic = require('serve-static');
const dirTree = require("directory-tree");
const path = require('path');
const bodyParser = require('body-parser');
const morgan = require("morgan")

let listenPort = 8080;
let rootPath = null;

function init() {
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
    initExpress();
}

function initExpress() {
    const app = express();
    const server = http.Server(app);

    app.use(bodyParser.urlencoded({ extended: false }));

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
                extensions: /\.(mp4|txt|html)$/,
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

init();


