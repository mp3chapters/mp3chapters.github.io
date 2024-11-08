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

const deleteSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3" viewBox="0 0 16 16">
  <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5"/>
</svg>`;

export function initializeImageHandling() {
    window.chapterImages = [];
    window.hiddenImages = new Set(); // images that are not displayed in the gallery

    window.chapters.addEventListener(buildGallery);
    document.addEventListener('paste', handlePaste);

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
        const files = fileInput.files;
        for (const file of files) {
            addToGallery(file);
        }
    });

    const deleteCoverImageButton = document.getElementById('delete-cover-image-button');

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
            deleteCoverImageButton.classList.remove('d-none');
        };
        reader.readAsArrayBuffer(file);
    });

    deleteCoverImageButton.addEventListener('click', function () {
        window.coverImage = "deleted";
        const img = document.getElementById('cover-image');
        img.src = '/img/placeholder.png';
        deleteCoverImageButton.classList.add('d-none');
    });

    document.getElementById('clean-gallery-button').addEventListener('click', function () {
        // find all images that are not used by any chapter
        // and add their indexes to the hiddenImages array
        const usedImages = getUsedImages();
        window.hiddenImages = new Set();
        for (let i = 0; i < window.chapterImages.length; i++) {
            if (!usedImages.has(i)) {
                window.hiddenImages.add(i);
            }
        }
        buildGallery();
    });
}

function getUsedImages() {
    const usedImages = new Map(); // number of times each image is used
    for (const chapter of window.chapters.getChapters()) {
        if (chapter.imageId !== undefined) {
            if (usedImages.has(chapter.imageId)) {
                usedImages.set(chapter.imageId, usedImages.get(chapter.imageId) + 1);
            } else {
                usedImages.set(chapter.imageId, 1);
            }
        }
    }
    return usedImages;
}

export async function addImageBufferToGallery(imageBuffer, mime) {
    // Generate a SHA-256 hash of the file
    let hashBuffer;
    try {
        hashBuffer = await crypto.subtle.digest('SHA-256', imageBuffer);
    } catch (e) {
        // Fallback for browsers that don't support the Web Crypto API
        // in this case, we won't be able to compare images by hash
        // so duplicate images will be added to the gallery
        hashBuffer = [window.chapterImages.length - 1];
    }
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Check if the image already exists in the gallery
    for (let i = 0; i < window.chapterImages.length; i++) {
        if (window.chapterImages[i].hash === hashHex) {
            // If a matching image is found, return its ID
            return i;
        }
    }

    // If the image doesn't exist, add it to the gallery
    const image = {
        imageBuffer: imageBuffer,
        mime: mime,
        type: { id: 0, name: 'other' },
        hash: hashHex, // Store the hash for future comparisons
    };

    window.chapterImages.push(image);
    buildGallery();
    container.open = true;

    // Scroll to the bottom of the gallery, unless the text-input is focused
    if (document.activeElement !== document.getElementById('text-input')) {
        const gallery = document.getElementById('gallery');
        const lastImage = gallery.lastElementChild;
        if (window.currentFilename !== 'example.mp3') {
            lastImage.scrollIntoView();
        }
    }

    return window.chapterImages.length - 1;
}

async function addToGallery(file) {
    const buffer = await file.arrayBuffer();
    const imageBuffer = new Uint8Array(buffer);
    return addImageBufferToGallery(imageBuffer, file.type);
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

function handlePaste(e) {

    if (e.target.id === 'text-input') {
        handleTextInputPaste(e);
        return;
    }

    const items = e.clipboardData.items;
    let imageFound = false;

    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            imageFound = true;
            const blob = items[i].getAsFile();
            addToGallery(blob);
        }
    }

    if (imageFound) {
        e.preventDefault();
    }
}

async function handleTextInputPaste(e) {
    const items = e.clipboardData.items;
    
    let imageItem = null;

    if (items.length === 1 && items[0].type.indexOf('image') !== -1) {
        imageItem = items[0];
    } else if (items.length === 2 && items[0].type.indexOf('text/') !== 1 && items[1].type.indexOf('image') !== -1) {
        // this happens if an image is copied from a browser
        imageItem = items[1];
    }

    // If there's exactly one image and nothing else
    if (imageItem) {
        e.preventDefault();
        const blob = imageItem.getAsFile();
        const newImageId = await addToGallery(blob);
        
        // Insert the image tag at the end of the current line
        const textInput = document.getElementById('text-input');
        const cursorPos = textInput.selectionStart;
        const textValue = textInput.value;
        const lineStart = textValue.lastIndexOf('\n', cursorPos - 1) + 1;
        const lineEnd = textValue.indexOf('\n', cursorPos);
        const insertPos = lineEnd === -1 ? textValue.length : lineEnd;

        const textBefore = textValue.substring(0, insertPos);
        const textAfter = textValue.substring(insertPos);
        const newText = textBefore + ` <img-${newImageId}>` + textAfter;
        textInput.value = newText;

        // Move the cursor after the inserted tag
        const newCursorPos = insertPos + ` <img-${newImageId}>`.length;
        textInput.setSelectionRange(newCursorPos, newCursorPos);

        // Trigger any necessary events (e.g., for reactive frameworks)
        textInput.dispatchEvent(new Event('input', { bubbles: true }));
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
    const usedImages = getUsedImages();
    for (let i = 0; i < window.chapterImages.length; i++) {
        gallery.style.visibility = 'visible';
        const image = window.chapterImages[i];
        const figure = document.createElement('figure');
        if (window.hiddenImages.has(i) && !usedImages.has(i)) {
            figure.style.display = 'none';
        }
        figure.className = 'figure mx-2';
        const img = document.createElement('img');
        const blob = new Blob([image.imageBuffer], { type: image.mime });
        const url = URL.createObjectURL(blob);
        img.src = url;
        img.className = 'figure-img rounded img-thumbnail gallery-img';
        // tippy(img, { content: `<img src="${url}" class="gallery-image-tooltip">`, allowHTML: true, placement: 'auto', maxWidth: 'none' });
        const figcaption = document.createElement('figcaption');
        figcaption.className = 'figure-caption text-center';
        const code = document.createElement('code');
        code.innerHTML = `&lt;img-${i}&gt;`;
        figcaption.appendChild(code);
        const button = document.createElement('button');
        button.className = 'btn btn-sm btn-light btn-gallery-copy';
        button.ariaLabel = "Copy image tag";
        button.innerHTML = copySVG;
        tippy(button, { content: `Copy <img-${i}>`, placement: 'auto' });
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
        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn btn-sm btn-light btn-gallery-delete';
        deleteButton.ariaLabel = "Delete image";
        deleteButton.innerHTML = deleteSVG;
        tippy(deleteButton, { content: `Delete image (used ${usedImages.get(i) || 0} times)`, placement: 'auto' });
        deleteButton.addEventListener('click', function () {
            window.hiddenImages.add(i);
            for (const chapter of window.chapters.getChapters()) {
                if (chapter.imageId === i) {
                    chapter.imageId = undefined;
                }
            }
            if (usedImages.has(i)) {
                // something was changed, so need to update the chapters
                window.chapters.setChapters(window.chapters.getChapters());
            }
            buildGallery();
        });
        figcaption.appendChild(deleteButton);
        figure.appendChild(img);
        figure.appendChild(figcaption);
        gallery.appendChild(figure);
    }
}


export function encodeImage(image) {
    return new Promise((resolve, reject) => {
        var img = new Image();

        img.onload = function () {
            // no need to resize
            if (image.mime === 'image/jpeg' && img.width <= 1400 && img.height <= 1400
                || image.mime === 'image/png' && image.imageBuffer.length < 100000 ) {
                resolve(image);
            } else {
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
            }

            // Revoke the blob URL to release memory
            URL.revokeObjectURL(img.src);
        };

        img.onerror = function () {
            reject(new Error('Image loading failed'));
        };

        // Set the source of the image to the blob URL
        var blob = new Blob([image.imageBuffer], { type: image.mime });
        img.src = URL.createObjectURL(blob);
    });
}
