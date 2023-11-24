import { buildGallery } from "./ImageHandler.js";

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
        console.log(tags);
        if (tags.hasOwnProperty('chapter')) {
            const parsedChapters = [];
            for (let chapter of tags.chapter) {
                const chapterObject = {
                    title: chapter.tags.title,
                    start: chapter.startTimeMs / 1000,
                };
                if (chapter.tags.hasOwnProperty('userDefinedUrl')) {
                    chapterObject.url = chapter.tags.userDefinedUrl[0].url;
                }
                if (chapter.tags.hasOwnProperty('image')) {
                    window.chapterImages.push(chapter.tags.image);
                    chapterObject.imageId = window.chapterImages.length - 1;
                    document.getElementById('gallery-container').open = true;
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

        if (tags.hasOwnProperty('image')) {
            const img = document.getElementById('cover-image');
            const blob = new Blob([tags.image.imageBuffer], { type: tags.image.mime });
            const url = URL.createObjectURL(blob);
            img.src = url;
        }

        buildGallery();
    });

    document.getElementById('filename').innerText = file.name;

    document.getElementById('podlove').open = false;
}