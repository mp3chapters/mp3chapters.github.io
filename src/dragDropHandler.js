function isGalleryVisible() {
    const element = document.getElementById('gallery-container');
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;

    // Check if the element is in the viewport (with at least one edge)
    const vertInView = (rect.top <= windowHeight) && ((rect.top + rect.height) >= 0);
    const horInView = (rect.left <= windowWidth) && ((rect.left + rect.width) >= 0);

    return (vertInView && horInView);
}

function isAudioFile(ev) {
    const data = ev.dataTransfer.items;
    for (let i = 0; i < data.length; i += 1) {
        if (data[i].kind === "file" && data[i].type.match("^audio/")) {
            return true;
        }
    }
    return false;
}

// if gallery is not visible, display a full screen drop overlay
// if gallery is visible, display a drop overlay only over the hero image

export function initializeDragDrop(callback) {
    const dropOverlay = document.getElementById('drop-overlay');
    const heroOverlay = document.getElementById('hero-drop-overlay');
    const hero = document.getElementById('hero');

    function dragOverHandler(ev) {
        if (isAudioFile(ev) && !isGalleryVisible()) {
            dropOverlay.style.display = "block";
        }
        ev.preventDefault();
    }

    function heroDragOverHandler(ev) {
        if (isAudioFile(ev) && isGalleryVisible()) {
            heroOverlay.style.display = "block";
        }
        ev.preventDefault();
    }

    function dragEndHandler(ev) {
        dropOverlay.style.display = "none";
        heroOverlay.style.display = "none";
        ev.preventDefault();
    }

    function dropHandler(ev) {
        dropOverlay.style.display = "none";
        heroOverlay.style.display = "none";

        ev.preventDefault();

        if (isAudioFile(ev) && ev.dataTransfer.items) {
            [...ev.dataTransfer.items].forEach((item) => {
                if (item.kind === "file") {
                    let file = item.getAsFile();
                    let reader = new FileReader();

                    reader.onload = function (e) {
                        let blob = e.target.result;
                        // Call the provided callback with the file name and file text
                        callback(file.name, blob);
                    };

                    reader.readAsArrayBuffer(file);
                }
            });
        }
    }

    document.body.addEventListener('drop', (e) => {
        if (isGalleryVisible()) {
            return;
        } dropHandler(e);
    });
    document.body.addEventListener('dragover', dragOverHandler);
    document.body.addEventListener('dragenter', dragOverHandler);
    document.body.addEventListener('dragleave', dragEndHandler);

    hero.addEventListener('drop', dropHandler);
    hero.addEventListener('dragover', heroDragOverHandler);
    hero.addEventListener('dragenter', heroDragOverHandler);
    hero.addEventListener('dragleave', dragEndHandler);

}
