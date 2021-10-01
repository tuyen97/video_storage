$(function () {
    let tree = document.getElementById("tree");
    let mediaElement = null;
    let videoContainer = document.getElementById("video-container");
    let $video = document.getElementById('video');
    let player = videojs($video, { controls: true });


    function sortChildren(a, b) {
        let n1 = parseInt(a.name.split(".")[0]);
        let n2 = parseInt(b.name.split(".")[0]);
        return n1 - n2;
    }

    let count = 0;
    function drawTree(elem, data, rootDir) {
        let li = document.createElement("li");
        li.textContent = data.name;
        elem.append(li);
        if (data.extension === ".mp4") {
            console.log(data.path);
            console.log(rootDir);
            let fileRelativePath = data.path.replace(rootDir, "");
            li.dataset.link = "/video-data/" + fileRelativePath;
            li.dataset.sub = "/video-data/" + fileRelativePath.replace(".mp4", ".srt");
            li.dataset.isFolder = false;
        }

        let ul = document.createElement("ul");
        if (count) {
            ul.hidden = true;
        }
        li.append(ul);
        count++;
        if (data.children) {
            let children = data.children;
            children.sort(sortChildren);
            for (let child of children) {
                drawTree(ul, child, rootDir);
            }
        }

    }

    let textTrack;
    tree.addEventListener("click", async function (event) {
        let target = event.target;
        if (target.dataset.link) {
            videoContainer.hidden = false;
            player.removeRemoteTextTrack(textTrack);
            if (target.dataset.sub) {
                let blob = await fetch(target.dataset.sub).then(r => r.blob());
                let vttConverter = new WebVTTConverter(blob);
                let url = await vttConverter.getURL();
                player.src(target.dataset.link);
                textTrack = player.addRemoteTextTrack({
                    kind: 'subtitle',
                    language: 'en',
                    label: 'Eng',
                    src: url,
                    default: true
                });
            }
            player.play();
        } else {
            let ul = target.getElementsByTagName("ul");
            ul[0].hidden = !ul[0].hidden;
        }
    })
    $.get("/tree", function (data) {
        console.log(data["root_dir"]);
        drawTree(tree, data.data, data["root_dir"]);
    });
    // videoContainer.hidden = true;
    //
})