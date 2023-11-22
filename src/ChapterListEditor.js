import { secondsToString, stringToSeconds } from './utils.js';

const linkSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-link-45deg" viewBox="0 0 16 16">
    <path d="M4.715 6.542 3.343 7.914a3 3 0 1 0 4.243 4.243l1.828-1.829A3 3 0 0 0 8.586 5.5L8 6.086a1.002 1.002 0 0 0-.154.199 2 2 0 0 1 .861 3.337L6.88 11.45a2 2 0 1 1-2.83-2.83l.793-.792a4.018 4.018 0 0 1-.128-1.287z"/>
    <path d="M6.586 4.672A3 3 0 0 0 7.414 9.5l.775-.776a2 2 0 0 1-.896-3.346L9.12 3.55a2 2 0 1 1 2.83 2.83l-.793.792c.112.42.155.855.128 1.287l1.372-1.372a3 3 0 1 0-4.243-4.243z"/>
</svg>`;

function extractUrl(str) {
    const urlRegex = / https?:\/\/[^\s]+$/;
    const match = str.match(urlRegex);
    if (match) {
        const url = match[0];
        const stringWithoutUrl = str.replace(urlRegex, '').trim();
        return { url, stringWithoutUrl };
    } else {
        // No URL found, return null for the URL and the original string
        return { url: null, stringWithoutUrl: str };
    }
}

export function updateChapterListBasedOnTextarea() {
    const textInput = document.getElementById('text-input');
    const lines = textInput.value.trim().split('\n');
    const newChapters = [];
    const encounteredTimes = new Set();

    lines.forEach((line, index) => {
        const chapter = { title: '', start: 0, error: '' };

        // Regex to handle optional parentheses and split time and title
        const match = line.match(/^\(?(\d{1,2}:\d{1,2}(?::\d{1,2})?)\)?\s*[-:—–\s]?(.+)/);
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

                const { url, stringWithoutUrl } = extractUrl(title);
                chapter.title = stringWithoutUrl;
                if (url) {
                    chapter.url = url.trim();
                }
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

        // Show time
        if (chapter.start != -1) {
            const a = document.createElement('span');
            a.className = 'highlight';
            a.textContent = secondsToString(chapter.start);
            a.addEventListener('click', (e) => {
                player.currentTime = chapter.start;
                e.stopPropagation();
            });
            lineSpan.appendChild(a);

            lineSpan.dataset.start = chapter.start;
            lineSpan.dataset.end = chapter.end;
        }
        // Show title
        const titleSpan = document.createElement('span');
        titleSpan.textContent = chapter.title;
        lineSpan.appendChild(titleSpan);
        textDisplay.appendChild(lineSpan);
        // Show URL
        if (chapter.url) {
            const urlSpan = document.createElement('span');
            urlSpan.className = 'url';
            // clean up url
            let url = chapter.url.replace(/(https?:\/\/)?(www\.)?/, '');
            // truncate url
            if (url.length > 35) {
                url = url.substring(0, 35) + '...';
            }
            urlSpan.innerHTML = `${linkSVG}${url}`;
            lineSpan.appendChild(urlSpan);
        }
        // Show error
        if (chapter.error) {
            const errorSpan = document.createElement('span');
            errorSpan.className = 'text-danger error';
            errorSpan.innerHTML = `${chapter.error}`; //${alertSVG}
            lineSpan.appendChild(errorSpan);
        }
        // Show warning
        if (chapter.warning) {
            const warningSpan = document.createElement('span');
            warningSpan.className = 'warning';
            warningSpan.innerHTML = `${chapter.warning}`; //${alertSVG}
            lineSpan.appendChild(warningSpan);
        }

        // Add button
        // const button = document.createElement('button');
        // button.textContent = 'Add image';
        // button.className = 'add-image';
        // button.onclick = () => addImage(index);
        // buttonContainer.appendChild(button);
    }

    const scrollTop = textInput.scrollTop;
    const scrollLeft = textInput.scrollLeft;

    textInput.style.display = 'none';
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
            if (chapter.url) {
                return `${secondsToString(chapter.start)} ${chapter.title} ${chapter.url}`;
            } else {
                return `${secondsToString(chapter.start)} ${chapter.title}`;
            }
        }
    });
    textInput.value = lines.join('\n');
}

export function editText() {
    const textInput = document.getElementById('text-input');
    const textDisplay = document.getElementById('text-display');

    const scrollTop = textDisplay.scrollTop;
    const scrollLeft = textDisplay.scrollLeft;

    textInput.style.display = 'block';
    textDisplay.style.display = 'none';

    textInput.focus();

    textInput.scrollTop = scrollTop;
    textInput.scrollLeft = scrollLeft;
}

export function highlightCurrentLine() {
    const lines = document.getElementsByClassName('line');
    for (let line of lines) {
        if (line.dataset.start <= window.currentTime && window.currentTime < line.dataset.end) {
            line.classList.add('current-line');
        } else {
            line.classList.remove('current-line');
        }
    }
}