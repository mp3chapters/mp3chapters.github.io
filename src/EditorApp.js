import WaveSurfer from '/libs/wavesurfer.esm.js';
import { startBaseApp, updateButtonPosition } from './BaseApp.js';
import { initializeDragDrop } from './submodules/DragDropHandler.js';
import { loadFile } from './submodules/FileLoader.js';

export function startEditorApp() {
    startBaseApp();

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
    window.wave = wave;

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

    window.denseMode = document.querySelector("body").classList.contains("dense");
    window.usedDenseMode = false;

    document.getElementById('activate-dense-mode-button').addEventListener('click', activateDenseMode);
    document.getElementById('close-dense-mode-button').addEventListener('click', deactivateDenseMode);
    if (document.querySelector("body").classList.contains("dense")) {
        activateDenseMode();
    }

    initializeDragDrop({ multipleFiles: false, heroTarget: true }, (filename, blob) => {
        const file = new File([blob], filename);
        loadFile(file, window.wave, player);
    });

    document.addEventListener('DOMContentLoaded', function () {
        // fetch and load example file
        fetch('example.mp3')
            .then(response => response.blob())
            .then(blob => {
                const file = new File([blob], 'example.mp3');
                loadFile(file, window.wave, player);
            });
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

    document.getElementById('mp3FileInputTriggerButton').addEventListener('click', () => {
        document.getElementById('mp3FileInput').click();
    });

    document.getElementById('mp3FileInput').addEventListener('change', function () {
        const fileInput = document.getElementById('mp3FileInput');
        const file = fileInput.files[0];
        loadFile(file, wave, player);
    });

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

    document.getElementById('addTagsButton-dense').addEventListener('click', function () {
        document.getElementById('addTagsButton').click();
    });

    document.getElementById('mp3FileInputTriggerButton-dense').addEventListener('click', () => {
        document.getElementById('mp3FileInput').click();
    });
}