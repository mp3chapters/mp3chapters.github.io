import { exportImageZip } from './FileExport.js';

export function updatePodlove() {
    const code = document.getElementById('podlove-code');
    code.innerHTML = chapters.exportAsPodlove().replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const jsonCode = document.getElementById('json-code');
    jsonCode.innerHTML = chapters.exportAsJSON().replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function setUpExportButtons() {

    const podloveButton = document.getElementById('podloveButton');
    if (podloveButton) {
        podloveButton.addEventListener('click', function () {
            updatePodlove();
            const container = document.getElementById('podlove');
            container.classList.remove("d-none");
            container.open = true;
            gtag('event', 'podlove', {});
        });
    }

    const podloveSummary = document.getElementById('podloveSummary');
    if (podloveSummary) {
        podloveSummary.addEventListener('click', function () {
            updatePodlove();
        });
    }

    const imgLinkSwitch = document.getElementById('imgLinkSwitch');
    imgLinkSwitch.addEventListener('click', function () {
        updatePodlove();
        document.getElementById('imageLinkInfo').classList.toggle("d-none");
    });

    document.getElementById('imageURL').addEventListener('blur', function () {
        updatePodlove();
    });

    document.getElementById('downloadZipButton').addEventListener('click', function () {
        exportImageZip();
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

    document.getElementById('downloadPodloveButton').addEventListener('click', function () {
        const code = chapters.exportAsPodlove();
        const filename = window.currentFilename.replace(/\.[^/.]+$/, "") + ".psc";
        const blob = new Blob([code], {type: "application/xml"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        a.remove();
    });

    document.getElementById('copyJSONButton').addEventListener('click', function () {
        const code = chapters.exportAsJSON();
        navigator.clipboard.writeText(code).then(function() {
            const button = document.getElementById('copyJSONButton');
            const copyCheck = document.getElementById('json-copy-check');
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

    document.getElementById('downloadJSONButton').addEventListener('click', function () {
        const code = chapters.exportAsJSON();
        const filename = window.currentFilename.replace(/\.[^/.]+$/, "") + ".json";
        const blob = new Blob([code], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        a.remove();
    });
}