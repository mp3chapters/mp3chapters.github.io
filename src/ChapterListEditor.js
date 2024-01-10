import { secondsToString, stringToSeconds } from './utils.js';

const linkSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-link-45deg" viewBox="0 0 16 16">
    <path d="M4.715 6.542 3.343 7.914a3 3 0 1 0 4.243 4.243l1.828-1.829A3 3 0 0 0 8.586 5.5L8 6.086a1.002 1.002 0 0 0-.154.199 2 2 0 0 1 .861 3.337L6.88 11.45a2 2 0 1 1-2.83-2.83l.793-.792a4.018 4.018 0 0 1-.128-1.287z"/>
    <path d="M6.586 4.672A3 3 0 0 0 7.414 9.5l.775-.776a2 2 0 0 1-.896-3.346L9.12 3.55a2 2 0 1 1 2.83 2.83l-.793.792c.112.42.155.855.128 1.287l1.372-1.372a3 3 0 1 0-4.243-4.243z"/>
</svg>`;

const imageSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-image" viewBox="0 0 16 16">
    <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/>
    <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12"/>
</svg>`;

function removeLastOccurrence(str, substring) {
    const index = str.lastIndexOf(substring);
    if (index === -1) {
        return str;
    }
    return str.substring(0, index) + str.substring(index + substring.length);
}

function extractElements(str) {
    const urlRegex = /^https?:\/\/[^\s]+$/;
    const imgTagRegex = /^<img-(\d+)>$/;

    let substrings = str.split(" ");
    let url = null, imgTag = null;

    for (let i = substrings.length - 1; i >= 0; i--) {
        if (!url && urlRegex.test(substrings[i])) {
            url = substrings[i];
            substrings.splice(i, 1); // Remove the URL from the array
        }
        if (!imgTag && imgTagRegex.test(substrings[i])) {
            imgTag = substrings[i].match(/\d+/)[0];
            substrings.splice(i, 1);  // Remove the image tag from the array
        }
    }

    let stringWithoutElements = substrings.join(' ');

    return { url, imgTag, stringWithoutElements };
}

export function updateChapterListBasedOnTextarea() {
    const textInput = document.getElementById('text-input');
    const lines = textInput.value.trim().split('\n');
    const newChapters = [];
    const encounteredTimes = new Set();

    lines.forEach((line, index) => {
        const chapter = { title: '', start: 0, error: '' };

        // Regex to handle optional parentheses and split time and title
        // const match = line.match(/^\(?(\d{1,2}:\d{1,2}(?::\d{1,2}(\.\d+)?)?)\)?\s*[-:—–\s]?(.+)/);
        // const match = line.match(/^\(?(\d{1,2}:\d{1,2}(?::\d{1,2})?(?:\.\d{1,3})?)\)?\s*[-:—–\s]?(.+)/);
        // const match = line.match(/^\(?((\d{1,2}:)?\d{1,2}(?::\d{1,2})?(?:\.\d{1,3})?)\)?\s*[-:—–\s]?(.+)/);
        const match = line.match(/^\(?((?:\d{1,2}:)?\d{1,2}(?::\d{1,2})?(?:\.\d{1,3})?)\)?\s*[-:—–\s]?(.*)/);


        if (match && match.length === 3) {
            const timeString = match[1].trim();
            const title = match[2].trim();

            try {
                const time = stringToSeconds(timeString);
                if (encounteredTimes.has(time)) {
                    chapter.error = 'Duplicate timestamp, chapter ignored';
                } else {
                    encounteredTimes.add(time);
                }
                chapter.start = time;

                const { url, imgTag, stringWithoutElements } = extractElements(title);
                chapter.title = stringWithoutElements.trim();
                if (imgTag != null) {
                    chapter.imageId = parseInt(imgTag);
                    if (chapter.imageId < 0 || chapter.imageId >= window.chapterImages.length) {
                        chapter.error = 'Invalid image id';
                    }
                }
                chapter.url = url;
            } catch (e) {
                chapter.error = 'Invalid time format';
                chapter.start = -1;
                chapter.title = line.trim();
            }

        } else {
            chapter.start = -1;
            chapter.title = line.trim();
            chapter.error = 'Invalid format: Missing or incorrect time or title';
        }

        newChapters.push(chapter);
    });

    window.chapters.setChapters(newChapters);
}

export function displayChapterList() {
    const textInput = document.getElementById('text-input');
    const textDisplay = document.getElementById('text-display');
    const buttonContainer = document.getElementById('button-container');

    textDisplay.innerHTML = '';
    buttonContainer.innerHTML = '';

    for (let chapter of window.chapters.getChapters()) {
        const lineSpan = document.createElement('div');
        lineSpan.className = 'line';
        lineSpan.ariaLabel = "Chapter";

        // Show time
        if (chapter.start != -1) {
            const a = document.createElement('span');
            a.className = 'timestamp';
            a.textContent = secondsToString(chapter.start);
            a.addEventListener('click', (e) => {
                player.currentTime = chapter.start / 1000;
                e.stopPropagation();
            });
            lineSpan.appendChild(a);

            lineSpan.dataset.start = chapter.start;
            lineSpan.dataset.end = chapter.end;
        }
        // Show title
        const titleSpan = document.createElement('span');
        titleSpan.textContent = chapter.title;
        if (chapter.title[0] == "_") {
            titleSpan.className = 'text-secondary';
        }
        lineSpan.appendChild(titleSpan);
        textDisplay.appendChild(lineSpan);
        // Show URL
        if (chapter.url) {
            const urlSpan = document.createElement('span');
            urlSpan.className = 'url';
            urlSpan.ariaLabel = "Chapter URL";
            // clean up url
            let url = chapter.url.replace(/(https?:\/\/)?(www\.)?/, '');
            // truncate url
            if (url.length > 35) {
                url = url.substring(0, 35) + '...';
            }
            urlSpan.innerHTML = `${linkSVG}${url}`;
            tippy(urlSpan, { content: chapter.url });
            lineSpan.appendChild(urlSpan);
        }
        // Show image
        if (chapter.imageId != undefined && window.chapterImages[chapter.imageId] != undefined) {
            const imageSpan = document.createElement('span');
            imageSpan.className = 'image';
            imageSpan.ariaLabel = "Chapter image";
            imageSpan.innerHTML = `${imageSVG}&lt;img-${chapter.imageId}&gt;`;
            lineSpan.appendChild(imageSpan);
            // tippy
            const image = window.chapterImages[chapter.imageId];
            const imageElement = document.createElement('img');
            const blob = new Blob([image.imageBuffer], { type: image.mime });
            const url = URL.createObjectURL(blob);
            imageElement.src = url;
            imageElement.loading = 'lazy';
            imageElement.className = 'chapter-image-tooltip';
            tippy(imageSpan, { content: imageElement, allowHTML: true });
        }
        // Show error
        if (chapter.error) {
            const errorSpan = document.createElement('span');
            errorSpan.className = 'text-danger error';
            errorSpan.ariaLabel = "Error";
            errorSpan.innerHTML = `${chapter.error}`; //${alertSVG}
            lineSpan.appendChild(errorSpan);
        }
        // Show warning
        if (chapter.warning) {
            const warningSpan = document.createElement('span');
            warningSpan.className = 'warning';
            warningSpan.ariaLabel = "Warning";
            warningSpan.innerHTML = `${chapter.warning}`; //${alertSVG}
            lineSpan.appendChild(warningSpan);
        }
    }

    const scrollTop = textInput.scrollTop;
    const scrollLeft = textInput.scrollLeft;

    // textInput.style.display = 'none';
    textDisplay.style.display = 'block';

    textDisplay.scrollTop = scrollTop;
    textDisplay.scrollLeft = scrollLeft;
}

export function setTextAreaContent() {
    const textInput = document.getElementById('text-input');
    const lines = window.chapters.getChapters().map(chapter => {
        if (chapter.start === -1) {
            return chapter.title;
        } else {
            const url = chapter.url ? ` ${chapter.url}` : '';
            const image = chapter.imageId != undefined ? ` <img-${chapter.imageId}>` : '';
            return `${secondsToString(chapter.start)} ${chapter.title}${url}${image}`;
        }
    });
    textInput.value = lines.join('\n');
    window.allowClosing = false; // unsaved changes
}

export function editText(e) {
    const textDisplay = document.getElementById('text-display');
    const textInput = document.getElementById('text-input');
    if (textDisplay.style.display === 'block') {

        const scrollTop = textDisplay.scrollTop;
        const scrollLeft = textDisplay.scrollLeft;

        // textInput.style.display = 'block';
        textDisplay.style.display = 'none';

        textInput.focus();

        textInput.scrollTop = scrollTop;
        textInput.scrollLeft = scrollLeft;
    }
}

export function adjustTextAreaHeight() {
    const lineHeight = 1.5 * 15;
    let height = lineHeight * window.chapters.getChapters().length;
    if (document.getElementById("text-display").style.display === 'none') {
        // instead use number of lines in textarea
        const textInput = document.getElementById('text-input');
        height = lineHeight * textInput.value.split('\n').length;
    }
    height = Math.max(height + 10, 530); // 10px padding
    for (let id of ['text-input', 'text-display', 'editor-container']) {
        document.getElementById(id).style.height = `${height}px`;
    }
}

export function highlightCurrentLine() {
    const lines = document.getElementsByClassName('line');
    for (let line of lines) {
        if (line.dataset.start <= window.currentTime * 1000 && window.currentTime * 1000 < line.dataset.end) {
            line.classList.add('current-line');
        } else {
            line.classList.remove('current-line');
        }
    }
}