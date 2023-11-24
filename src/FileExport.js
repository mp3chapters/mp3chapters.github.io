import { encodeImage } from './ImageHandler.js';

async function exportFileBasedOnOldTags(file, tags) {
    const chapterTag = [];
    const tocTag = {
        elementID: 'toc',
        isOrdered: true,
        elements: [],
    };
    let chapterIndex = 0;
    for (let chapter of window.chapters.getChapters()) {
        if (!chapter.error) {
            const chapterObject = {
                elementID: `chp${chapterIndex}`,
                startTimeMs: chapter.start,
                endTimeMs: chapter.end,
                tags: {
                    title: chapter.title,
                }
            };
            if (chapter.hasOwnProperty('url')) {
                chapterObject.tags.userDefinedUrl = {
                    url: chapter.url,
                }
            }
            if (chapter.hasOwnProperty('imageId')) {
                try {
                    chapterObject.tags.image = await encodeImage(window.chapterImages[chapter.imageId]);
                } catch (error) {
                    console.error('Error encoding image:', error);
                }
            }            
            chapterTag.push(chapterObject);
            tocTag.elements.push(`chp${chapterIndex}`);
            chapterIndex++;
        }
    }
    tags.chapter = chapterTag;
    tags.tableOfContents = tocTag;
    // console.log("Exporting", chapterTag);

    for (let field of window.fieldNames) {
        const input = document.getElementById(`field-${field}`);
        if (input.value != input.dataset.oldValue) {
            tags[field] = input.value;
        }
    }

    if (window.coverImage != null) {
        tags.image = await encodeImage(window.coverImage);
    }

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