function isGalleryVisible() {
    const element = document.getElementById('gallery-container');
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;

    // Check if the element is in the viewport (with at least one edge)
    const vertInView = (rect.top <= windowHeight) && ((rect.top + rect.height) >= 0);
    const horInView = (rect.left <= windowWidth) && ((rect.left + rect.width) >= 0);

    return (vertInView && horInView && element.open);
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

export function initializeDragDrop(options, callback) {
    const { multipleFiles, heroTarget } = options;

    const dropOverlay = document.getElementById('drop-overlay');
    const heroOverlay = document.getElementById('hero-drop-overlay');
    const hero = document.getElementById('hero');


    // DP, Feb 2024: not sure we need any of this logic. If it's an audio file, we should allow drop.

    function dragOverHandler(ev) {
        if (isAudioFile(ev) && (window.denseMode || !isGalleryVisible())) {
            dropOverlay.style.display = "block";
        }
        ev.preventDefault();
    }

    function heroDragOverHandler(ev) {
        if (isAudioFile(ev) && (window.denseMode || !isGalleryVisible())) {
            heroOverlay.style.display = "block";
        }
        ev.preventDefault();
    }

    function dragEndHandler(ev) {
        dropOverlay.style.display = "none";
        heroOverlay.style.display = "none";
        ev.preventDefault();
    }

    async function dropHandler(ev) {
        dropOverlay.style.display = "none";
        heroOverlay.style.display = "none";
    
        ev.preventDefault();

        let files = [];
    
        if (isAudioFile(ev) && ev.dataTransfer.items) {
            for (let item of ev.dataTransfer.items) {
                if (item.kind === "file") {
                    let file = item.getAsFile();
                    if (multipleFiles) {
                        files.push(file);
                        continue;
                    }
                    try {
                        let arrayBuffer = await file.arrayBuffer();
                        if (!multipleFiles) {
                            callback(file.name, arrayBuffer);
                        }
                    } catch (error) {
                        console.error('Error reading file:', error);
                    }
                }
            }
            if (multipleFiles) {
                callback(files);
            }
        }
    }

    document.body.addEventListener('drop', (e) => {
        if (!window.denseMode && isGalleryVisible()) {
            return;
        } dropHandler(e);
    });
    document.body.addEventListener('dragover', dragOverHandler);
    document.body.addEventListener('dragenter', dragOverHandler);
    document.body.addEventListener('dragleave', dragEndHandler);

    if (heroTarget) {
        hero.addEventListener('drop', dropHandler);
        hero.addEventListener('dragover', heroDragOverHandler);
        hero.addEventListener('dragenter', heroDragOverHandler);
        hero.addEventListener('dragleave', dragEndHandler);
    }

}
