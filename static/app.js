$(function () {
    let tree = document.getElementById("tree");
    let mediaElement = null;
    let videoContainer = document.getElementById("video-container");
    let $video = document.getElementById('video');
    let player = videojs($video,  { controls: true });

    function drawTree(elem, data) {
        let ul = document.createElement("ul");
        ul.textContent = data.name;
        elem.append(ul);
        if (data.children) {
            for (let child of data.children) {
                drawTree(ul, child);
            }
        }
        if (data.extension === ".mp4") {
            ul.dataset.link = "/video-data/" + data.path;
            ul.dataset.sub = "/video-data/" + data.path.replace(".mp4", ".srt")
        }
    }

    let textTrack;
    tree.addEventListener("click", async function (event) {
        let target = event.target;
        if (target.dataset.link) {
            videoContainer.hidden = false;
            player.removeRemoteTextTrack(textTrack);
            if (target.dataset.sub){
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
        }
    })
    $.get("/tree", function (data) {
        drawTree(tree, data)
    });
    // videoContainer.hidden = true;
//
})