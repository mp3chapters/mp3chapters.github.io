// image: {
//     imageBuffer: ...,
//     mime: 'image/png',
//     type: {id: 3, name: 'front cover'},
// }

const copySVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
class="bi bi-clipboard2-check" viewBox="0 0 16 16">
    <path d="M9.5 0a.5.5 0 0 1 .5.5.5.5 0 0 0 .5.5.5.5 0 0 1 .5.5V2a.5.5 0 0 1-.5.5h-5A.5.5 0 0 1 5 2v-.5a.5.5 0 0 1 .5-.5.5.5 0 0 0 .5-.5.5.5 0 0 1 .5-.5z" />
    <path d="M3 2.5a.5.5 0 0 1 .5-.5H4a.5.5 0 0 0 0-1h-.5A1.5 1.5 0 0 0 2 2.5v12A1.5 1.5 0 0 0 3.5 16h9a1.5 1.5 0 0 0 1.5-1.5v-12A1.5 1.5 0 0 0 12.5 1H12a.5.5 0 0 0 0 1h.5a.5.5 0 0 1 .5.5v12a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5z" />
    <path d="M10.854 7.854a.5.5 0 0 0-.708-.708L7.5 9.793 6.354 8.646a.5.5 0 1 0-.708.708l1.5 1.5a.5.5 0 0 0 .708 0l3-3Z" id="publove-copy-check" style="visibility: hidden" />
</svg>`;

export function initializeImageHandling() {
    window.chapterImages = [];

    const container = document.getElementById('gallery-container');
    container.addEventListener('drop', dropHandler);
    container.addEventListener('dragover', dragOverHandler);
    container.addEventListener('dragenter', dragOverHandler);
    container.addEventListener('dragleave', dragEndHandler);

    document.getElementById('upload-image-button').addEventListener('click', function () {
        document.getElementById('imageFileInput').click();
    });

    document.getElementById('imageFileInput').addEventListener('change', function () {
        const fileInput = document.getElementById('imageFileInput');
        const file = fileInput.files[0];
        addToGallery(file);
    });

    document.getElementById('upload-cover-image-button').addEventListener('click', function () {
        document.getElementById('coverImageFileInput').click();
    });

    document.getElementById('coverImageFileInput').addEventListener('change', function () {
        const fileInput = document.getElementById('coverImageFileInput');
        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = function (e) {
            const image = {
                imageBuffer: new Uint8Array(e.target.result),
                mime: file.type,
                type: { id: 3, name: 'front cover' },
            };
            window.coverImage = image;
            const img = document.getElementById('cover-image');
            const blob = new Blob([image.imageBuffer], { type: image.mime });
            const url = URL.createObjectURL(blob);
            img.src = url;
        };
        reader.readAsArrayBuffer(file);
    });
}

function addToGallery(file) {
    console.log(file);
    let reader = new FileReader();
    reader.onload = function (e) {
        const image = {
            imageBuffer: new Uint8Array(e.target.result),
            mime: file.type,
            type: { id: 0, name: 'other' },
        };
        window.chapterImages.push(image);
        buildGallery();
        // scroll to bottom of gallery
        const gallery = document.getElementById('gallery');
        const lastImage = gallery.lastElementChild;
        lastImage.scrollIntoView();
    };
    reader.readAsArrayBuffer(file);
}

function isImageFile(ev) {
    const data = ev.dataTransfer.items;
    for (let i = 0; i < data.length; i += 1) {
        if (data[i].kind === "file" && data[i].type.match("^image/")) {
            return true;
        }
    }
    return false;
}

const container = document.getElementById('gallery-container');
const dropOverlay = document.getElementById('gallery-drop-overlay');

function dragOverHandler(ev) {
    if (isImageFile(ev)) {
        const body = container.querySelector('.card-body');
        dropOverlay.style.height = body.offsetHeight + 'px';
        dropOverlay.style.width = body.offsetWidth + 'px';
        dropOverlay.style.display = "block";
        container.open = true;
    }
    ev.preventDefault();
}

function dragEndHandler(ev) {
    dropOverlay.style.display = "none";
    ev.preventDefault();
}

function dropHandler(ev) {
    dropOverlay.style.display = "none";
    ev.preventDefault();

    if (isImageFile(ev) && ev.dataTransfer.items) {
        [...ev.dataTransfer.items].forEach((item) => {
            if (item.kind === "file") {
                let file = item.getAsFile();
                const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                if (allowedTypes.includes(file.type)) {
                    addToGallery(file);
                }
            }
        });
    }
}

function blobToUint8Array(blob, callback) {
    var reader = new FileReader();

    reader.onloadend = function () {
        if (reader.readyState === FileReader.DONE) {
            var arrayBuffer = reader.result;
            var uint8Array = new Uint8Array(arrayBuffer);
            callback(uint8Array);
        }
    };

    reader.onerror = function () {
        console.error('There was an error reading the blob as an ArrayBuffer.');
    };

    reader.readAsArrayBuffer(blob);
}

export function buildGallery() {
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = '';
    gallery.style.visibility = 'hidden';
    for (let i = 0; i < window.chapterImages.length; i++) {
        gallery.style.visibility = 'visible';
        const image = window.chapterImages[i];
        const figure = document.createElement('figure');
        figure.className = 'figure mx-2';
        const img = document.createElement('img');
        const blob = new Blob([image.imageBuffer], { type: image.mime });
        const url = URL.createObjectURL(blob);
        img.src = url;
        img.className = 'figure-img rounded img-thumbnail gallery-img';
        tippy(img, { content: `<img src="${url}" class="gallery-image-tooltip">`, allowHTML: true, placement: 'auto', maxWidth: 'none' });
        const figcaption = document.createElement('figcaption');
        figcaption.className = 'figure-caption text-center';
        const code = document.createElement('code');
        code.innerHTML = `&lt;img-${i}&gt;`;
        figcaption.appendChild(code);
        const button = document.createElement('button');
        button.className = 'btn btn-sm btn-light btn-gallery-copy';
        button.innerHTML = copySVG;
        button.addEventListener('click', function () {
            navigator.clipboard.writeText(`<img-${i}>`).then(function () {
                button.classList.add("btn-outline-success");
                setTimeout(function () {
                    button.classList.remove("btn-outline-success");
                }, 3000);
            }).catch(function (error) {
                // Error handling
                console.error('Error copying text: ', error);
            });
        });
        figcaption.appendChild(button);
        figure.appendChild(img);
        figure.appendChild(figcaption);
        gallery.appendChild(figure);
    }
}


export function encodeImage(image) {
    return new Promise((resolve, reject) => {
        var img = new Image();

        console.log("Encoding image", image);

        img.onload = function () {
            console.log("Image loaded");

            if (image.mime === 'image/jpeg') {
                if (img.width <= 1400 && img.height <= 1400) {
                    // no need to resize
                    resolve(image);
                }
            }
            // if it's a png and filesize is < 100kb, no need to resize
            if (image.mime === 'image/png' && image.imageBuffer.size < 100000) {
                resolve(image);
            }

            console.log("Resizing image");

            // Calculate new dimensions
            var maxSize = 1400; // maximum size of the largest dimension
            var width = img.width;
            var height = img.height;

            if (width > height && width > maxSize) {
                height *= maxSize / width;
                width = maxSize;
            } else if (height > maxSize) {
                width *= maxSize / height;
                height = maxSize;
            }

            // Create a canvas and draw the resized image onto it
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            // Convert the canvas content to a JPEG blob
            canvas.toBlob(function (resizedBlob) {
                blobToUint8Array(resizedBlob, function (uint8Array) {
                    const newImage = {
                        ...image,
                        imageBuffer: uint8Array,
                        mime: 'image/jpeg',
                    };
                    console.log("Resized image", newImage);
                    resolve(newImage);
                });
            }, 'image/jpeg');

            img.onerror = function () {
                reject(new Error('Image loading failed'));
            };

            // Revoke the blob URL to release memory
            URL.revokeObjectURL(img.src);
        };

        // Set the source of the image to the blob URL
        var blob = new Blob([image.imageBuffer], { type: image.mime });
        img.src = URL.createObjectURL(blob);
    });
}