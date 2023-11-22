export function initializeDragDrop(callback) {
    const dropOverlay = document.getElementById('drop-overlay');

    function dragOverHandler(ev) {
        dropOverlay.style.display = "block";
        ev.preventDefault();
    }

    function dragStartHandler(ev) {
        dropOverlay.style.display = "block";
        ev.preventDefault();
    }

    function dragEndHandler(ev) {
        dropOverlay.style.display = "none";
        ev.preventDefault();
    }

    function dropHandler(ev) {
        dropOverlay.style.display = "none";
        ev.preventDefault();

        if (ev.dataTransfer.items) {
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

    document.body.addEventListener('drop', dropHandler);
    document.body.addEventListener('dragover', dragOverHandler);
    document.body.addEventListener('dragenter', dragStartHandler);
    document.body.addEventListener('dragleave', dragEndHandler);
}
