function exportFileBasedOnOldTags(file, tags) {
    console.log(tags);

    const chapterTag = [];
    const tocTag = {
        elementID: 'toc',
        isOrdered: true,
        elements: [],
    };
    let chapterIndex = 0;
    for (let chapter of window.chapters.getChapters()) {
        chapterTag.push({
            elementID: `chp${chapterIndex}`,
            startTimeMs: Math.round(chapter.start * 1000),
            endTimeMs: Math.round(chapter.end * 1000),
            tags: {
                title: chapter.title,
            }
        });
        tocTag.elements.push(`chp${chapterIndex}`);
    }
    tags.chapter = chapterTag;
    tags.tableOfContents = tocTag;

    for (let field of window.fieldNames) {
        const input = document.getElementById(`field-${field}`);
        if (input.value != input.dataset.oldValue) {
            tags[field] = input.value;
        }
    }

    console.log("New tags:");
    console.log(tags);

    // Call the addTags function from your bundle
    addTags(tags, file, function (taggedBuffer) {
        // Convert buffer to Blob
        const blob = new Blob([taggedBuffer], { type: 'audio/mp3' });

        // Create object URL
        const url = URL.createObjectURL(blob);

        // Create download link
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = window.currentFilename;
        downloadLink.click();
    });
}

export function exportFile(file) {
    readTags(file, (fileTags) => { exportFileBasedOnOldTags(file, fileTags) });
}