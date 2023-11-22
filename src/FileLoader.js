export function loadFile(file, wave, player) {
    wave.loadBlob(file);
    player.src = { src: file, type: 'audio/object' };
    window.currentFilename = file.name;
    window.currentFile = file;

    let tags;
    readTags(file, (fileTags) => {
        tags = fileTags;
        if (tags.hasOwnProperty('chapter')) {
            const parsedChapters = [];
            for (let chapter of tags.chapter) {
                parsedChapters.push({
                    title: chapter.tags.title,
                    start: chapter.startTimeMs / 1000,
                });
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
    });

    document.getElementById('filename').innerText = file.name;

    document.getElementById('podlove').open = false;
}