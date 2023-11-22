import { secondsToString, stringToSeconds } from './utils.js';

const alertSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-exclamation-triangle" viewBox="0 0 16 16">
<path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.146.146 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.163.163 0 0 1-.054.06.116.116 0 0 1-.066.017H1.146a.115.115 0 0 1-.066-.017.163.163 0 0 1-.054-.06.176.176 0 0 1 .002-.183L7.884 2.073a.147.147 0 0 1 .054-.057zm1.044-.45a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566z"/>
<path d="M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 5.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0z"/>
</svg>`;

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
                chapter.title = title;
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
            return `${secondsToString(chapter.start)} ${chapter.title}`;
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