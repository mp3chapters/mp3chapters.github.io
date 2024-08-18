import WaveSurfer from './libs/wavesurfer.esm.js';
import * as popperModule from './libs/popper.min.js';
import * as tippyModule from './libs/tippy-bundle.umd.min.js';
import * as nodeID3Module from './node-id3-browserify.min.js';
import * as vidstackModule from './libs/vidstack.js';

import { ChapterList } from './src/ChapterList.js';
import { setTextAreaContent, displayChapterList, updateChapterListBasedOnTextarea, editText, adjustTextAreaHeight, highlightCurrentLine } from './src/ChapterListEditor.js';
import { loadFile } from './src/FileLoader.js';
import { exportFile } from './src/FileExport.js';
import { initializeDragDrop } from './src/dragDropHandler.js';
import { initializeImageHandling } from './src/ImageHandler.js';
import { updatePodlove, setUpExportButtons } from './src/OtherFormatExports.js';

const chapters = new ChapterList();
window.chapters = chapters;

window.currentTime = 0;

window.denseMode = document.querySelector("body").classList.contains("dense");
window.usedDenseMode = false;

window.allowClosing = true;
window.addEventListener('beforeunload', function (e) {
    if (window.allowClosing) {
        return undefined;
    }
    e.preventDefault();
    e.returnValue = true;
});

// id3 field names that are supported
window.fieldNames = ["title", "artist", "album", "trackNumber", "genre", "year", "date", "copyright", "publisher", "language", "encodedBy"];

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
        if (chapter.error == undefined || chapter.error == '') {
            track.addCue({ 
                "startTime": chapter.start / 1000, 
                "endTime": chapter.end / 1000, 
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
    setColorScheme();
    initializeImageHandling();
    setUpExportButtons();

    const textInput = document.getElementById('text-input');
    textInput.addEventListener('blur', updateChapterListBasedOnTextarea);
    textInput.addEventListener('mousedown', editText);
    textInput.addEventListener('input', adjustTextAreaHeight);

    document.getElementById('activate-dense-mode-button').addEventListener('click', activateDenseMode);
    document.getElementById('close-dense-mode-button').addEventListener('click', deactivateDenseMode);
    if (document.querySelector("body").classList.contains("dense")) {
        activateDenseMode();
    }

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

function setColorScheme() {
    const hero = document.getElementById('hero-image');
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.dataset.bsTheme = 'dark';
        hero.src = 'hero-dark.jpg';
    } else {
        document.documentElement.dataset.bsTheme = 'light';
        hero.src = 'hero.jpg';
    }
}

function activateDenseMode() {
    window.denseMode = true;
    document.querySelector("body").classList.add("dense");
    document.getElementById("gallery-container").open = true;
    // store preference for dense mode
    localStorage.setItem('denseMode', true);
    updateButtonPosition();
}

function deactivateDenseMode() {
    window.denseMode = false;
    document.querySelector("body").classList.remove("dense");
    document.getElementById("edit-chapter-heading").scrollIntoView({ behavior: "instant" });
    // store preference against dense mode
    localStorage.setItem('denseMode', false);
    updateButtonPosition();
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    setColorScheme();
});

const wave = WaveSurfer.create({
    container: '#wave',
    waveColor: 'violet',
    progressColor: 'purple',
    cursorColor: '#333',
    cursorWidth: 3,
    dragToSeek: true,
    partialRender: true,
    sampleRate: 5000,
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
    wave.setTime(window.currentTime);
});

wave.on('ready', () => {
    wave.setOptions({
        waveColor: 'violet',
        progressColor: 'purple',
    });
    document.getElementById("addTimestamp").style.display = null;
    wave.setTime(window.currentTime);
});

player.addEventListener('loaded-data', () => {
    addChaptersToPlayer();
    // make player visible
    document.querySelector("#player-container .card-body").style.visibility = "visible";
});

player.addEventListener('play', () => {
    addChaptersToPlayer();
});

function updateButtonPosition() {
    // move add chapter button to cursor
    const button = document.getElementById('addTimestamp');
    const buttonWidth = button.offsetWidth;
    // compute style
    if (window.waveHidden) {
        button.style.top = '10px';
    } else {
        button.style.top = window.denseMode ? '66px' : '80px';
    }
    const cardPadding = window.denseMode ? 0 : 15.5;
    const leftOffset = 16; // padding of displayed wave within player
    const rightOffset = leftOffset;
    const innerWidth = player.offsetWidth - leftOffset - rightOffset;
    const buttonGap = window.waveHidden ? 0 : 7;
    const left = cardPadding + leftOffset + innerWidth * window.currentTime / chapters.duration;
    if (left + buttonWidth < leftOffset + innerWidth) {
        button.style.left = left + buttonGap + 'px';
        button.style.flexDirection = '';
    } else {
        button.style.left = left - buttonWidth - buttonGap + 'px';
        button.style.flexDirection = 'row-reverse';
    }
}

player.addEventListener('time-update', (e) => {
    window.currentTime = e.detail.currentTime;
    wave.setTime(e.detail.currentTime);
    highlightCurrentLine();
    updateButtonPosition();
});

player.addEventListener('duration-change', (e) => {
    chapters.duration = e.detail;
});

document.getElementById('addTimestamp').addEventListener('click', () => {
    let start = window.currentTime * 1000;
    if (!chapters.usesMs) {
        // round to nearest second
        start = Math.round(window.currentTime) * 1000;
    }
    chapters.addChapter('New chapter', start);
});

document.getElementById('mp3FileInputTriggerButton').addEventListener('click', () => {
    document.getElementById('mp3FileInput').click();
});

document.getElementById('mp3FileInputTriggerButton-dense').addEventListener('click', () => {
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

document.getElementById('addTagsButton-dense').addEventListener('click', function () {
    exportFile(window.currentFile);
});

document.getElementById('copyListButton').addEventListener('click', function () {
    const code = chapters.exportAsList();
    navigator.clipboard.writeText(code).then(function() {
        const button = document.getElementById('copyListButton');
        const copyCheck = document.getElementById('list-copy-check');
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

window.addEventListener('resize', updateButtonPosition);

// for (const input of document.querySelectorAll('#tag-editing input')) {
//     input.addEventListener('keydown', function () {
//         window.allowClosing = false;
//     });
// }