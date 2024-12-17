import * as popperModule from '../libs/popper.min.js';
import * as tippyModule from '../libs/tippy-bundle.umd.min.js';
import * as nodeID3Module from '../node-id3-browserify.min.js';
import * as vidstackModule from '../libs/vidstack.js';

import { ChapterList } from './submodules/ChapterList.js';
import { setTextAreaContent, displayChapterList, updateChapterListBasedOnTextarea, editText, adjustTextAreaHeight, highlightCurrentLine } from './submodules/ChapterListEditor.js';
import { exportFile } from './submodules/FileExport.js';
import { initializeImageHandling } from './submodules/ImageHandler.js';
import { updatePodlove, setUpExportButtons } from './submodules/OtherFormatExports.js';

export function startBaseApp() {
    const chapters = new ChapterList();
    window.chapters = chapters;

    window.currentTime = 0;

    window.allowClosing = true;
    window.addEventListener('beforeunload', function (e) {
        if (window.allowClosing) {
            return undefined;
        }
        e.preventDefault();
        e.returnValue = true;
    });

    // id3 field names that are supported
    window.fieldNames = ["title", "artist", "album", "trackNumber", "genre", "year", "date", "copyright", "publisher", "language", "encodedBy", "audioSourceUrl"];

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

        tippy('[data-tippy-content]');

        // place back1 and skip1 buttons
        const seekButtons = document.querySelectorAll('media-seek-button');
        const back10 = seekButtons[0]; const skip10 = seekButtons[1]; const back1 = seekButtons[2]; const skip1 = seekButtons[3];
        // move back1 just after back10
        back10.parentNode.insertBefore(back1, back10.nextSibling);
        // move skip1 just before skip10
        skip10.parentNode.insertBefore(skip1, skip10);
        back10.style.marginRight = "-4px";
        skip1.style.marginRight = "-4px";
    });

    function setColorScheme() {
        // const hero = document.getElementById('hero-image');
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.dataset.bsTheme = 'dark';
            // if (hero) hero.src = 'hero-dark.jpg';
        } else {
            document.documentElement.dataset.bsTheme = 'light';
            // if (hero) hero.src = 'hero.jpg';
        }
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
        setColorScheme();
    });

    const player = document.getElementById('player');
    window.player = player;

    player.addEventListener('loaded-data', async () => {
        addChaptersToPlayer();
        // make player visible
        document.querySelector("#player-container .card-body").style.visibility = "visible";
    });

    player.addEventListener('play', () => {
        addChaptersToPlayer();
    });

    player.addEventListener('time-update', (e) => {
        window.currentTime = e.detail.currentTime;
        if (window.wave) {
            window.wave.setTime(e.detail.currentTime);
        }
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

    document.getElementById('addTagsButton').addEventListener('click', function () {
        exportFile(window.currentFile);
    });

    window.addEventListener('resize', updateButtonPosition);

}

export function updateButtonPosition() {
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