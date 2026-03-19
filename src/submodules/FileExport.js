import { encodeImage } from './ImageHandler.js';
import { convertToM4B, createVideo } from './FFmpeg.js';

/**
 * Build a tagged MP3 blob from the current file and editor state.
 * Returns { blob, stats, filename }.
 */
function buildTaggedMP3(file) {
    return new Promise((resolve) => {
        readTags(file, async (tags) => {
            const chapterTag = [];
            const tocTag = {
                elementID: 'toc',
                isOrdered: true,
                elements: [],
            };
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
                const blob = new Blob([taggedBuffer], { type: 'audio/mp3' });
                resolve({ blob, stats });
            });
        });
    });
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = filename;
    downloadLink.click();
}

function sendAnalytics(stats) {
    if (window.currentFilename != "example.mp3"
        && window.location.host == "mp3chapters.github.io"
        && stats.durationMinutes > 4) {
        gtag('event', 'export', stats);
        fetch('https://dominik-peters.de/projects/mp3chapters/mp3chapters-log.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            mode: 'no-cors',
            body: JSON.stringify(stats)
        });
    }
}

function showSpinner() {
    document.getElementById("spinner").classList.remove("d-none");
}

function hideSpinner() {
    setTimeout(() => {
        document.getElementById("spinner").classList.add("d-none");
    }, 200);
}

export async function exportFile(file) {
    showSpinner();
    const { blob, stats } = await buildTaggedMP3(file);
    downloadBlob(blob, window.currentFilename);
    hideSpinner();
    sendAnalytics(stats);
    window.allowClosing = true;
}

export async function exportM4B(file) {
    showSpinner();
    try {
        const { blob: mp3Blob, stats } = await buildTaggedMP3(file);
        const m4bBlob = await convertToM4B(mp3Blob);
        const filename = window.currentFilename.replace(/\.mp3$/i, '.m4b');
        downloadBlob(m4bBlob, filename);
        stats.exportFormat = 'm4b';
        sendAnalytics(stats);
    } catch (error) {
        console.error('M4B export failed:', error);
        alert('M4B export failed: ' + error.message);
    }
    hideSpinner();
    window.allowClosing = true;
}

export async function exportVideo(file) {
    showSpinner();
    const progressContainer = document.getElementById('export-progress');
    const progressBar = document.getElementById('export-progressbar');
    try {
        const { blob: mp3Blob, stats } = await buildTaggedMP3(file);
        const chapters = window.chapters.getChapters().filter(ch => !ch.error);
        const totalDuration = window.chapters.duration;
        if (progressContainer) {
            progressBar.style.width = '0%';
            progressContainer.classList.remove('d-none');
        }
        const mp4Blob = await createVideo(
            mp3Blob,
            chapters,
            window.chapterImages,
            window.coverImage,
            (seconds) => {
                if (progressBar && totalDuration > 0) {
                    const pct = Math.min(100, (seconds / totalDuration) * 100);
                    requestAnimationFrame(() => {
                        progressBar.style.width = `${pct}%`;
                        progressBar.setAttribute('aria-valuenow', pct);
                    });
                }
            }
        );
        const filename = window.currentFilename.replace(/\.mp3$/i, '.mp4');
        downloadBlob(mp4Blob, filename);
        stats.exportFormat = 'video';
        sendAnalytics(stats);
    } catch (error) {
        console.error('Video export failed:', error);
        alert('Video export failed: ' + error.message);
    }
    if (progressContainer) progressContainer.classList.add('d-none');
    hideSpinner();
    window.allowClosing = true;
}

export async function exportImageZip() {
    const script = document.createElement('script');
    script.src = '/libs/jszip.min.js';
    script.onload = async function() {
        const zip = new JSZip();
        const imageFolder = zip.folder("images");
        for (let i = 0; i < window.chapterImages.length; i++) {
            const image = await encodeImage(window.chapterImages[i]);
            imageFolder.file(`image-${i}.jpg`, image.imageBuffer);
        }
        zip.generateAsync({ type: "blob" }).then(function (content) {
            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(content);
            downloadLink.download = `${window.currentFilename.replace(".mp3","")}_images.zip`;
            downloadLink.click();
        });
    };
    document.head.appendChild(script);
}
