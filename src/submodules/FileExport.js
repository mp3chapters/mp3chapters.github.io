import { encodeImage } from './ImageHandler.js';

async function exportFileBasedOnOldTags(file, tags) {
    const chapterTag = [];
    const tocTag = {
        elementID: 'toc',
        isOrdered: true,
        elements: [],
    };
    // collect coarse data for Google Analytics
    const stats = {
        app: window.location.pathname,
        durationMinutes: Math.round(window.chapters.duration / 60),
        numChapters: window.chapters.getChapters().length,
        usedImages: false,
        usedURLs: false,
        changedID3Fields: false,
        changedCoverImage: false,
        usedDenseMode: window.usedDenseMode,
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
            if (chapter.hasOwnProperty('url') && chapter.url) {
                chapterObject.tags.userDefinedUrl = {
                    url: chapter.url,
                }
                stats.usedURLs = true;
            }
            if (chapter.hasOwnProperty('imageId')) {
                try {
                    chapterObject.tags.image = await encodeImage(window.chapterImages[chapter.imageId]);
                } catch (error) {
                    console.error('Error encoding image:', error);
                }
                stats.usedImages = true;
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

    for (let field of window.fieldNames) {
        const input = document.getElementById(`field-${field}`);
        tags[field] = input.value;
        if (input.value != input.dataset.oldValue) {
            stats.changedID3Fields = true;
        }
    }

    if (window.coverImage === "deleted") {
        tags.image = null;
        stats.changedCoverImage = true;
    } else if (window.coverImage != null) {
        tags.image = await encodeImage(window.coverImage);
        stats.changedCoverImage = true;
    }

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

    if (window.currentFilename != "example.mp3" 
        && window.location.host == "mp3chapters.github.io"
        && stats.durationMinutes > 4) {
        // send event to Google Analytics
        gtag('event', 'export', stats);
        // send event to custom logger
        fetch('https://dominik-peters.de/projects/mp3chapters/mp3chapters-log.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            mode: 'no-cors',
            body: JSON.stringify(stats)
        });
    }
}

export function exportFile(file) {
    readTags(file, (fileTags) => { console.log(fileTags); exportFileBasedOnOldTags(file, fileTags) });
    window.allowClosing = true;
}

export async function exportImageZip() {
    const script = document.createElement('script');
    script.src = '/libs/jszip.min.js';
    script.onload = async function() {
        // Create zip file
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