import { startBaseApp } from './BaseApp.js';
import { Sortable } from '../libs/sortable.core.esm.min.js'; //https://www.jsdelivr.com/package/npm/sortablejs?tab=files&path=modular
import { loadFFmpeg, addFileToFFmpeg, getDuration, mergeFiles } from './submodules/FFmpeg.js';
import { initializeDragDrop } from './submodules/DragDropHandler.js';
import { addImageBufferToGallery } from './submodules/ImageHandler.js';

const gripSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-grip-vertical me-1" viewBox="0 0 16 16">
  <path d="M7 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0M7 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0M7 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0m-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0m-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
</svg>`;

function formatDuration(duration) {
    if (isNaN(duration)) return '';
    const totalSeconds = Math.floor(duration);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const minutesString = hours > 0 ? String(minutes).padStart(2, '0') : String(minutes);
    const secondsString = String(seconds).padStart(2, '0');
    if (hours > 0) {
        return `${hours}:${minutesString}:${secondsString}`;
    } else {
        return `${minutes}:${secondsString}`;
    }
}

export function startMergeApp() {
    startBaseApp();

    const mergeContainer = document.getElementById('merge-container');
    const fileInput = document.getElementById('mp3FileInput');
    const fileInputTriggerButton = document.getElementById('mp3FileInputTriggerButton');
    const fileList = document.getElementById('fileList');
    const mergeButton = document.getElementById('mergeButton');
    const normalMergeButtonContent = mergeButton.innerHTML;
    const sortByNameButton = document.getElementById('sortByNameButton');
    const reverseListButton = document.getElementById('reverseListButton');
    const clearAllButton = document.getElementById('clearAllButton');
    let filesArray = [];

    // Trigger file input when the button is clicked
    fileInputTriggerButton.addEventListener('click', () => {
        fileInput.click();
    });

    // Handle file selection
    fileInput.addEventListener('change', async (event) => {
        const newFiles = Array.from(event.target.files);
        await addFiles(newFiles);
    });

    async function addFiles(newFiles) {
        filesArray = filesArray.concat(newFiles);
        renderFileList();
        await loadFFmpeg();
        for (let file of newFiles) {
            // make a random id for the file
            file.id = Math.random().toString(36).substr(2, 9);
            readTags(file, (fileTags) => { file.tags = fileTags; renderFileList(); });
            await addFileToFFmpeg(file);
            file.duration = await getDuration(file);
        }
        renderFileList();

        // Update file button
        const button = document.getElementById('mp3FileInputTriggerButton');
        button.innerHTML = button.innerHTML.replace('Select', 'Add more');
        button.classList.remove('btn-primary');
        button.classList.add('btn-outline-primary');
    }

    initializeDragDrop({ multipleFiles: true, heroTarget: false }, addFiles);

    // Function to render the file list
    function renderFileList() {
        if (filesArray.length === 0) {
            mergeContainer.classList.add('d-none');
            const button = document.getElementById('mp3FileInputTriggerButton');
            button.innerHTML = button.innerHTML.replace('Add more', 'Select');
            button.classList.remove('btn-outline-primary');
            button.classList.add('btn-primary');
            return;
        }

        mergeContainer.classList.remove('d-none');

        let chaptersUsed = false;
        let imagesUsed = false;
        let titlesUsed = false;
        for (let file of filesArray) {
            if (file.tags && file.tags.tableOfContents && file.tags.tableOfContents.length > 0) {
                chaptersUsed = true;
            }
            if (file.tags && file.tags.image) {
                imagesUsed = true;
            }
            if (file.tags && file.tags.title) {
                titlesUsed = true;
            }
        }

        fileList.innerHTML = ''; // Clear existing list

        filesArray.forEach((file, index) => {
            const listItem = document.createElement('li');
            listItem.className = 'list-group-item d-flex align-items-center file-list-item ps-2';
            listItem.dataset.index = index;

            const filenameCheckbox = document.getElementById('useFilenames');
            file.descriptor = file.tags && file.tags.title && !filenameCheckbox.checked ? file.tags.title : file.name;

            const duration = file.duration ? formatDuration(file.duration) : '...';

            listItem.innerHTML = `
                ${gripSVG}
                <span class="text-truncate">
                    ${file.descriptor}
                </span>
                <span class="ms-auto me-3">
                    ${duration}
                </span>
                <button type="button" class="btn btn-outline-danger btn-sm delete-btn">Delete</button>
            `;

            file.listItem = listItem;

            fileList.appendChild(listItem);
        });

        fileList.querySelectorAll('.delete-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const index = e.target.parentElement.dataset.index;
                filesArray.splice(index, 1);
                renderFileList();
            });
        });

        document.getElementById('useFilenamesContainer').classList.toggle('d-none', !titlesUsed);
        document.getElementById('useSubchaptersContainer').classList.toggle('d-none', !chaptersUsed);
        document.getElementById('useCoversAsChapterImagesContainer').classList.toggle('d-none', !imagesUsed);

        mergeButton.disabled = false;

        const fileListStats = document.getElementById('fileListStats');
        if (window.innerWidth > 768) {
            fileListStats.innerHTML = `Number of files: ${filesArray.length} &middot; Total duration: ${formatDuration(filesArray.reduce((acc, file) => acc + file.duration, 0))}`;
            sortByNameButton.innerHTML = 'Sort by name';
            reverseListButton.innerHTML = 'Reverse list';
            clearAllButton.innerHTML = 'Clear all';
        } else {
            // small screen
            fileListStats.innerHTML = `Files: ${filesArray.length} &middot; Duration: ${formatDuration(filesArray.reduce((acc, file) => acc + file.duration, 0))}`;
            sortByNameButton.innerHTML = 'Sort';
            reverseListButton.innerHTML = 'Reverse';
            clearAllButton.innerHTML = 'Clear';
        }
    }

    sortByNameButton.addEventListener('click', () => {
        filesArray.sort((a, b) => a.descriptor.localeCompare(b.descriptor));
        renderFileList();
    });

    reverseListButton.addEventListener('click', () => {
        filesArray.reverse();
        renderFileList();
    });

    clearAllButton.addEventListener('click', () => {
        filesArray = [];
        renderFileList();
    });

    for (let checkbox of document.querySelectorAll('#merge-container input[type="checkbox"]')) {
        checkbox.addEventListener('change', renderFileList);
    }

    // Don't show wave element
    const playerCard = document.querySelector('#player-container > .card-body');
    playerCard.style.height = '';
    playerCard.style.paddingTop = '20px';
    window.waveHidden = true;

    // Handle merge button click
    mergeButton.addEventListener('click', async () => {
        mergeButton.disabled = true;
        mergeButton.innerHTML = 'Merging...';
        document.getElementById('chapter-editor-app-container').classList.add('d-none');

        const reencodeAudio = document.getElementById('reencodeAudio').checked;

        try {
            const totalDuration = filesArray.reduce((acc, file) => acc + file.duration, 0);
            const progressBar = document.getElementById('merge-progressbar');
            progressBar.style.width = '0%';
            progressBar.parentElement.classList.remove('d-none');
            const mergedBlob = await mergeFiles(filesArray, reencodeAudio, (progress) => {
                progressBar.style.width = `${(progress / totalDuration) * 100}%`;
                progressBar.setAttribute('aria-valuenow', (progress / totalDuration) * 100);
            });
            progressBar.parentElement.classList.add('d-none');
            const mergedFile = new File([mergedBlob], 'merged.mp3', { type: 'audio/mp3' });
            loadMergedFile(mergedFile);
        } catch (e) {
            alert('An error occurred while merging the files');
            console.error(e);
        } finally {
            mergeButton.innerHTML = normalMergeButtonContent;
            mergeButton.disabled = true;
        }
    });

    function copyTags(tags, inferFromAlbum = false) {
        if (tags.hasOwnProperty('encodedBy')) {
            tags.encodedBy = `${tags.encodedBy} and mp3chapters.github.io`;
        }
        for (let field of window.fieldNames) {
            const input = document.getElementById(`field-${field}`);
            if (field === 'title' && tags.hasOwnProperty('album') && inferFromAlbum) {
                // Use album as the title of the merged file
                input.value = tags.album;
                input.dataset.oldValue = "";
            } else if (tags.hasOwnProperty(field)) {
                input.value = tags[field];
                input.dataset.oldValue = "";
            } else {
                input.value = "";
                input.dataset.oldValue = "";
            }
        }
        const deleteCoverImageButton = document.getElementById('delete-cover-image-button');
        const img = document.getElementById('cover-image');
        if (tags.hasOwnProperty('image')) {
            const blob = new Blob([tags.image.imageBuffer], { type: tags.image.mime });
            const url = URL.createObjectURL(blob);
            img.src = url;
            window.coverImage = tags.image;
            deleteCoverImageButton.classList.remove('d-none');
        } else {
            img.src = "/img/placeholder.png";
            window.coverImage = null;
            deleteCoverImageButton.classList.add('d-none');
        }
    }

    async function loadMergedFile(file) {
        window.currentFilename = "merged.mp3";
        window.currentFile = file;
        window.chapters.duration = -1;
        window.chapterImages = [];
        player.src = { src: file, type: 'audio/object' };
        player.currentTime = 0;
        // fully set up player (ugly hack)
        setTimeout(async () => { 
            const rememberMute = player.mute; 
            player.mute = true; 
            await player.play(); 
            player.pause(); 
            player.mute = rememberMute;
        }, 500);

        // Set chapters
        const mergeChapters = [];
        let time = 0;
        const useMilliseconds = document.getElementById('useMilliseconds').checked;
        const useSubchapters = document.getElementById('useSubchapters').checked;
        const useCoversAsChapterImages = document.getElementById('useCoversAsChapterImages').checked;
        for (let file of filesArray) {
            const fileStartTime = useMilliseconds ? Math.round(time * 1000) : Math.round(time) * 1000;
            const fileChapter = {
                title: file.descriptor,
                start: fileStartTime,
            };
            if (useCoversAsChapterImages && file.tags && file.tags.image) {
                const imageId = await addImageBufferToGallery(file.tags.image.imageBuffer, file.tags.image.mime);
                fileChapter.imageId = imageId;
            }
            mergeChapters.push(fileChapter);
            if (useSubchapters && file.tags && file.tags.hasOwnProperty('chapter')) {
                for (let i = 0; i < file.tags.chapter.length; i++) {
                    const chapter = file.tags.chapter[i];
                    const initialSymbol = i < file.tags.chapter.length - 1 ? "├ " : "└ ";
                    mergeChapters.push({
                        title: initialSymbol + chapter.tags.title,
                        start: fileStartTime + chapter.startTimeMs,
                    });
                }
            }
            time += file.duration;
        }
        window.chapters.setChapters(mergeChapters);

        // File tags
        copyTags(filesArray[0].tags, true);
        const copySelect = document.getElementById('copy-tags-select');
        copySelect.innerHTML = '';
        const option = document.createElement('option');
        option.value = -1;
        option.textContent = 'Copy tags from one of the input files';
        copySelect.appendChild(option);
        for (let i = 0; i < filesArray.length; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = filesArray[i].descriptor;
            copySelect.appendChild(option);
        }
        const copyButton = document.getElementById('copy-tags-button');
        copyButton.addEventListener('click', () => {
            const index = parseInt(copySelect.value);
            if (index >= 0) {
                copyTags(filesArray[index].tags);
            }
        });


        document.getElementById('chapter-editor-app-container').classList.remove('d-none');

        // trigger input listener to update filename
        document.getElementById('field-title').dispatchEvent(new Event('input'));
    }

    document.getElementById('field-title').addEventListener('input', (e) => {
        if (e.target.value) {
            const sanitized = e.target.value.replace(/[\/\\:*?"<>|]/g, '').trim().substring(0, 255);
            window.currentFilename = sanitized + '.mp3';
        } else {
            window.currentFilename = 'merged.mp3';
        }
    });

    // Enable Sortable.js for the file list
    new Sortable(fileList, {
        animation: 150,
        onEnd: (evt) => {
            const movedItem = filesArray.splice(evt.oldIndex, 1)[0];
            filesArray.splice(evt.newIndex, 0, movedItem);
            renderFileList(); // Re-render after sorting
        },
    });
}