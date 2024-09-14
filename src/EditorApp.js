
import { startBaseApp, updateButtonPosition } from './BaseApp.js';
import { initializeDragDrop } from './submodules/DragDropHandler.js';
import { loadFile } from './submodules/FileLoader.js';

export function startEditorApp() {
    startBaseApp();

    window.denseMode = document.querySelector("body").classList.contains("dense");
    window.usedDenseMode = false;

    document.getElementById('activate-dense-mode-button').addEventListener('click', activateDenseMode);
    document.getElementById('close-dense-mode-button').addEventListener('click', deactivateDenseMode);
    if (document.querySelector("body").classList.contains("dense")) {
        activateDenseMode();
    }

    initializeDragDrop((filename, blob) => {
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