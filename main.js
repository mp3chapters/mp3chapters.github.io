import WaveSurfer from './libs/wavesurfer.esm.js'
import { secondsToString, stringToSeconds } from './src/utils.js';
import { ChapterList } from './src/ChapterList.js';
import { setTextAreaContent, displayChapterList, updateChapterListBasedOnTextarea, editText, adjustTextAreaHeight, highlightCurrentLine } from './src/ChapterListEditor.js';
import { loadFile } from './src/FileLoader.js';
import { exportFile } from './src/FileExport.js';
import { initializeDragDrop } from './src/dragDropHandler.js';
import { initializeImageHandling } from './src/ImageHandler.js';

const chapters = new ChapterList();
window.chapters = chapters;

window.currentTime = 0;

// id3 field names that are supported
window.fieldNames = ["title", "artist", "album", "trackNumber", "genre", "year", "copyright", "publisher", "language", "encodedBy"];

function addChaptersToPlayer() {
    const chapters_ = chapters.getChapters();
    const track = player.textTracks[0];
    while (track.cues.length > 0) {
        track.removeCue(track.cues[0]);
    }
    if (chapters_.length == 0) {
        track.addCue({ "startTime": 0, "endTime": chapters.duration, "text": "Chapter" });
    }
    for (let chapter of chapters_) {
        if (chapter.error == undefined) {
            track.addCue({ 
                "startTime": chapter.start, 
                "endTime": chapter.end, 
                "text": chapter.title 
            });
        }
    }
    // refresh
    track.mode = 'hidden';
    track.mode = 'showing';
}

chapters.addEventListener((chapters) => {
    // display chapters
    adjustTextAreaHeight();
    setTextAreaContent();
    displayChapterList();
    addChaptersToPlayer();
    updatePodlove();
    highlightCurrentLine();
});

document.addEventListener('DOMContentLoaded', function () {
    initializeImageHandling();

    const textInput = document.getElementById('text-input');
    textInput.addEventListener('blur', updateChapterListBasedOnTextarea);
    textInput.addEventListener('mousedown', editText);
    textInput.addEventListener('input', adjustTextAreaHeight);

    tippy('[data-tippy-content]');

    initializeDragDrop((filename, blob) => {
        const file = new File([blob], filename);
        loadFile(file, wave, player);
    });

    // place back1 and skip1 buttons
    const seekButtons = document.querySelectorAll('media-seek-button');
    const back10 = seekButtons[0]; const skip10 = seekButtons[1]; const back1 = seekButtons[2]; const skip1 = seekButtons[3];
    // move back1 just after back10
    back10.parentNode.insertBefore(back1, back10.nextSibling);
    // move skip1 just before skip10
    skip10.parentNode.insertBefore(skip1, skip10);
    back10.style.marginRight = "-4px";
    skip1.style.marginRight = "-4px";

    // fetch and load example file
    fetch('example.mp3')
        .then(response => response.blob())
        .then(blob => {
            const file = new File([blob], 'example.mp3');
            loadFile(file, wave, player);
        });
});

const wave = WaveSurfer.create({
    container: '#wave',
    waveColor: 'violet',
    progressColor: 'purple',
    cursorColor: '#333',
    cursorWidth: 3,
    dragToSeek: true,
    partialRender: true,
    sampleRate: 8000,
    barWidth: 4,
    barGap: 1,
    height: 100,
});

const player = document.getElementById('player');
window.player = player;

// on wave click, seek player to position
wave.on('interaction', (newTime) => {
    player.currentTime = newTime;
});

wave.on('load', () => {
    // set color to light grey
    wave.setOptions({
        waveColor: '#ddd',
        progressColor: '#999',
    });
});

wave.on('ready', () => {
    wave.setOptions({
        waveColor: 'violet',
        progressColor: 'purple',
    });
});

player.addEventListener('loaded-data', () => {
    addChaptersToPlayer();
});

player.addEventListener('play', () => {
    addChaptersToPlayer();
});

player.addEventListener('time-update', (e) => {
    window.currentTime = e.detail.currentTime;
    wave.setTime(e.detail.currentTime);
    highlightCurrentLine();
    // move add chapter button to cursor
    const button = document.getElementById('addTimestamp');
    const buttonWidth = button.offsetWidth;
    // const leftOffset = button.parentElement.style.paddingLeft + document.getElementById('wave').style.paddingLeft;
    const leftOffset = 16 + 15.5;
    const innerWidth = document.getElementById('wave').offsetWidth - leftOffset;
    const left = leftOffset + innerWidth * e.detail.currentTime / chapters.duration + 7; // 7 is the offset of the button
    button.style.position = 'absolute';
    if (left + buttonWidth < leftOffset + innerWidth) {
        button.style.left = left + 'px';
    } else {
        button.style.left = left - buttonWidth - 2*7 + 'px';
    }
    button.style.top = '80px';
    button.style.zIndex = '5';
});

player.addEventListener('duration-change', (e) => {
    chapters.duration = e.detail;
});

document.getElementById('addTimestamp').addEventListener('click', () => {
    chapters.addChapter('New chapter', player.currentTime);
});

document.getElementById('mp3FileInputTriggerButton').addEventListener('click', () => {
    document.getElementById('mp3FileInput').click();
});

document.getElementById('mp3FileInput').addEventListener('change', function () {
    const fileInput = document.getElementById('mp3FileInput');
    const file = fileInput.files[0];
    loadFile(file, wave, player);
});

document.getElementById('addTagsButton').addEventListener('click', function () {
    exportFile(window.currentFile);
});

function updatePodlove() {
    const code = document.getElementById('podlove-code');
    code.innerHTML = chapters.exportAsPodlove().replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

document.getElementById('podloveButton').addEventListener('click', function () {
    updatePodlove();
    const container = document.getElementById('podlove');
    container.classList.remove("d-none");
    container.open = true;
});

document.getElementById('copyPodloveButton').addEventListener('click', function () {
    const code = chapters.exportAsPodlove();
    navigator.clipboard.writeText(code).then(function() {
        const button = document.getElementById('copyPodloveButton');
        const copyCheck = document.getElementById('publove-copy-check');
        copyCheck.style.visibility = 'visible';
        button.classList.add("btn-outline-success");
        setTimeout(function() {
            copyCheck.style.visibility = 'hidden';
            button.classList.remove("btn-outline-success");
        }, 3000);
    }).catch(function(error) {
        // Error handling
        console.error('Error copying text: ', error);
    });
});