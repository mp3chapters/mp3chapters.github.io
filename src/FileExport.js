import { encodeImage } from './ImageHandler.js';

async function exportFileBasedOnOldTags(file, tags) {
    const chapterTag = [];
    const tocTag = {
        elementID: 'toc',
        isOrdered: true,
        elements: [],
    };
    // collect coarse data for Google Analytics
    const eventTag = {
        durationMinutes: Math.round(window.chapters.duration / 60),
        numChapters: window.chapters.getChapters().length,
        usedImages: false,
        usedURLs: false,
        changedID3Fields: false,
        changedCoverImage: false,
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
            if (chapter.title[0] == "_") {
                chapterObject.tags.title = chapter.title.substring(1);
            }
            if (chapter.hasOwnProperty('url')) {
                chapterObject.tags.userDefinedUrl = {
                    url: chapter.url,
                }
                eventTag.usedURLs = true;
            }
            if (chapter.hasOwnProperty('imageId')) {
                try {
                    chapterObject.tags.image = await encodeImage(window.chapterImages[chapter.imageId]);
                } catch (error) {
                    console.error('Error encoding image:', error);
                }
                eventTag.usedImages = true;
            }            
            chapterTag.push(chapterObject);
            if (chapter.title[0] != "_") {
                tocTag.elements.push(`chp${chapterIndex}`);
            }
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
        eventTag.changedID3Fields = true;
    }

    if (window.coverImage != null) {
        tags.image = await encodeImage(window.coverImage);
        eventTag.changedCoverImage = true;
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

    if (window.currentFilename != "example.mp3") {
        // send event to Google Analytics
        gtag('event', 'export', eventTag);
    }
}

export function exportFile(file) {
    readTags(file, (fileTags) => { exportFileBasedOnOldTags(file, fileTags) });
    window.allowClosing = true;
}

export async function exportImageZip() {
    // first load jszip (/js/jszip.min.js)
    const script = document.createElement('script');
    script.src = '/libs/jszip.min.js';
    script.onload = async function() {
        // then create zip file
        const zip = new JSZip();
        const imageFolder = zip.folder("images");
        for (let i = 0; i < window.chapterImages.length; i++) {
            const image = await encodeImage(window.chapterImages[i]);
            imageFolder.file(`image-${i}.jpg`, image.imageBuffer);
        }
        zip.generateAsync({ type: "blob" }).then(function (content) {
            // Create download link
            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(content);
            downloadLink.download = `${window.currentFilename.replace(".mp3","")}_images.zip`;
            downloadLink.click();
        });
    };
    document.head.appendChild(script);
}