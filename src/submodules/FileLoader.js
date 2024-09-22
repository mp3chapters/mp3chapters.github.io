import { buildGallery, addImageBufferToGallery } from "./ImageHandler.js";

function arrayEquals(a, b) {
    return a.length === b.length &&
        a.every((val, index) => val === b[index]);
}

let initialLoad = true;

function activateWave() {
    const playerCard = document.querySelector('#player-container > .card-body');
    playerCard.style.height = '';
    playerCard.style.paddingTop = '';
    document.getElementById('wave').style.display = 'block';
    window.waveHidden = false;
}

function deactivateWave() {
    const playerCard = document.querySelector('#player-container > .card-body');
    playerCard.style.height = '';
    playerCard.style.paddingTop = '50px';
    document.getElementById('wave').style.display = 'none';
    window.waveHidden = true;
}

export function loadFile(file, wave, player) {
    window.currentFilename = file.name;
    window.currentFile = file;
    window.chapters.duration = -1;
    window.chapterImages = [];
    document.getElementById('gallery-container').open = window.denseMode;
    const megabyte = 1024 * 1024;
    if (file.size < 50 * megabyte) {
        activateWave();
        wave.loadBlob(file);
    } else {
        deactivateWave();
        wave.loadBlob(null);
    }
    player.src = { src: file, type: 'audio/object' };
    player.currentTime = 0;

    let tags;
    readTags(file, async (fileTags) => {
        tags = fileTags;
        let toc = [];
        if (tags.hasOwnProperty('tableOfContents') && tags.tableOfContents.length > 0 && tags.tableOfContents[0].elements) {
            toc = tags.tableOfContents[0].elements;
        }
        if (tags.hasOwnProperty('chapter')) {
            const parsedChapters = [];
            for (let chapter of tags.chapter) {
                const chapterObject = {
                    title: chapter.tags.title,
                    start: chapter.startTimeMs,
                };
                if (!toc.includes(chapter.elementID)) {
                    if (chapterObject.title != undefined) {
                        chapterObject.title = "_" + chapterObject.title;
                    } else {
                        chapterObject.title = "_";
                    }
                    chapterObject.toc = false;
                }
                if (chapter.tags.hasOwnProperty('userDefinedUrl')) {
                    chapterObject.url = chapter.tags.userDefinedUrl[0].url;
                }
                if (chapter.tags.hasOwnProperty('image')) {
                    const imageId = await addImageBufferToGallery(chapter.tags.image.imageBuffer, chapter.tags.image.mime);
                    chapterObject.imageId = imageId;
                    document.getElementById('gallery-container').open = !initialLoad;
                }
                parsedChapters.push(chapterObject);
            }
            window.chapters.setChapters(parsedChapters);
        } else {
            const baseChapters = [
                {
                    "title": "Introduction",
                    "start": 0
                }
            ]
            window.chapters.setChapters(baseChapters);
        }

        if (tags.hasOwnProperty('encodedBy')) {
            tags.encodedBy = `${tags.encodedBy} and mp3chapters.github.io`;
        }

        for (let field of window.fieldNames) {
            const input = document.getElementById(`field-${field}`);
            if (tags.hasOwnProperty(field)) {
                input.value = tags[field];
                input.dataset.oldValue = tags[field];
            } else {
                input.value = "";
                input.dataset.oldValue = "";
            }
        }

        const deleteCoverImageButton = document.getElementById('delete-cover-image-button');

        const img = document.getElementById('cover-image');
        if (tags.hasOwnProperty('image')) {
            const blob = new Blob([tags.image.imageBuffer], { type: tags.image.mime });
            const url = URL.createObjectURL(blob);
            img.src = url;
            deleteCoverImageButton.classList.remove('d-none');
        } else {
            img.src = "img/placeholder.png";
            deleteCoverImageButton.classList.add('d-none');
        }

        buildGallery();

        initialLoad = false;
    });

    document.getElementById('filename').innerText = file.name;

    document.getElementById('podlove').open = false;
}