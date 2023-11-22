import { secondsToString, stringToSeconds } from './utils.js';

export function updateChapterListBasedOnTextarea() {
    const textInput = document.getElementById('text-input');
    const lines = textInput.value.split('\n');
    const newChapters = [];
    lines.forEach((line, index) => {
        // Highlight the first word
        const firstSpaceIndex = line.indexOf(' ');
        let firstWord = line;
        let restOfLine = '';

        if (firstSpaceIndex !== -1) {
            firstWord = line.substring(0, firstSpaceIndex);
            restOfLine = line.substring(firstSpaceIndex + 1);
            const sec = stringToSeconds(firstWord);
            newChapters.push({ title: restOfLine, start: sec });
        }
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
        const a = document.createElement('span');
        a.className = 'highlight';
        a.textContent = secondsToString(chapter.start);
        a.addEventListener('click', (e) => {
            player.currentTime = chapter.start;
            e.stopPropagation();
        });
        lineSpan.appendChild(a);
        // Show title
        const titleSpan = document.createElement('span');
        titleSpan.textContent = chapter.title;
        lineSpan.appendChild(titleSpan);
        textDisplay.appendChild(lineSpan);

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
    const lines = window.chapters.getChapters().map(chapter => `${secondsToString(chapter.start)} ${chapter.title}`);
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