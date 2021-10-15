$(function () {
    let tree = document.getElementById("tree");
    let videoContainer = document.getElementById("video-container");
    let $video = document.getElementById('video');

    // let player = videojs($video, { controls: true });


    function sortChildren(a, b) {
        let n1 = parseInt(a.name.split(".")[0]);
        let n2 = parseInt(b.name.split(".")[0]);
        return n1 - n2;
    }

    let count = 0;

    function drawTree(elem, data, rootDir) {
        let li = document.createElement("li");
        elem.append(li);
        li.textContent = data.name;
        if (data.extension === ".mp4") {
            let fileRelativePath = data.path.replace(rootDir, "");
            li.dataset.link = "/video-data/" + fileRelativePath;
            li.dataset.sub = "/video-data/" + fileRelativePath.replace(".mp4", ".srt");
            li.dataset.isFolder = false;
        }
        if (data.extension === ".txt" || data.extension === ".html"){
            let a = document.createElement("a");
            let fileRelativePath = data.path.replace(rootDir, "");
            li.textContent = ""
            a.setAttribute("href", "/video-data/" + fileRelativePath);
            a.textContent = data.name
            li.append(a);
        }

        let ul = document.createElement("ul");
        if (count) {
            ul.hidden = true;
        }
        count++;
        if (data.children) {
            li.append(ul);
            let children = data.children;
            children.sort(sortChildren);
            for (let child of children) {
                drawTree(ul, child, rootDir);
            }
        }

    }

    let prevElement;
    tree.addEventListener("click", async function (event) {
        let target = event.target;
        if (target.dataset.link) {
            if (prevElement){
                prevElement.style.background = "";
            }
            prevElement = target;
            target.style.background = "#069255";
            videoContainer.hidden = false;
            $video.setAttribute("src", target.dataset.link);

            // player.removeRemoteTextTrack(textTrack);
            if (target.dataset.sub) {
                let blob = await fetch(target.dataset.sub).then(r => r.blob());
                let vttConverter = new WebVTTConverter(blob);
                let url = await vttConverter.getURL();
                let track = document.getElementById("sub");
                track.setAttribute("src", url);
            }
            $video.load();
            $video.play();
        } else {
            let ul = target.getElementsByTagName("ul");
            ul[0].hidden = !ul[0].hidden;
        }
    })
    $.get("/tree", function (data) {
        console.log(data["root_dir"]);
        drawTree(tree, data.data, data["root_dir"]);
    });
})