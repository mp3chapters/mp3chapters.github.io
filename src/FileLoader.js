import { buildGallery } from "./ImageHandler.js";

function arrayEquals(a, b) {
    return a.length === b.length &&
        a.every((val, index) => val === b[index]);
}

let initialLoad = true;

export function loadFile(file, wave, player) {
    window.currentFilename = file.name;
    window.currentFile = file;
    window.chapters.duration = -1;
    window.chapterImages = [];
    document.getElementById('gallery-container').open = false;
    wave.loadBlob(file);
    player.src = { src: file, type: 'audio/object' };

    let tags;
    readTags(file, (fileTags) => {
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
                    // check if image is already in array (same buffer)
                    let found = -1;
                    for (let i = 0; i < window.chapterImages.length; i++) {
                        if (arrayEquals(window.chapterImages[i].imageBuffer, chapter.tags.image.imageBuffer)) {
                            found = i;
                            break;
                        }
                    }
                    if (found != -1) {
                        chapterObject.imageId = found;
                    } else {
                        window.chapterImages.push(chapter.tags.image);
                        chapterObject.imageId = window.chapterImages.length - 1;
                        if (!initialLoad) {
                            // do not open gallery on initial load with example file
                            document.getElementById('gallery-container').open = true;
                        }
                    }
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

        const img = document.getElementById('cover-image');
        if (tags.hasOwnProperty('image')) {
            const blob = new Blob([tags.image.imageBuffer], { type: tags.image.mime });
            const url = URL.createObjectURL(blob);
            img.src = url;
        } else {
            img.src = "img/placeholder.png";
        }

        buildGallery();

        initialLoad = false;
    });

    document.getElementById('filename').innerText = file.name;

    document.getElementById('podlove').open = false;
}