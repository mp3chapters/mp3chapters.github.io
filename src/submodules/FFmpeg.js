import { fetchFile } from '../../libs/ffmpeg/util.js';
import { FFmpeg } from '../../libs/ffmpeg/ffmpeg.js';

let ffmpeg = null;
let ffmpegLoading = null; // Tracks the initialization promise

export async function loadFFmpeg() {
    if (ffmpeg) {
        // FFmpeg is already initialized
        return;
    }
    if (ffmpegLoading) {
        // FFmpeg is in the process of initializing; wait for it to complete
        await ffmpegLoading;
        return;
    }
    // Start initializing FFmpeg and store the promise
    ffmpeg = new FFmpeg();
    ffmpeg.on("log", ({ message }) => {
        // console.log(message);
    });
    ffmpegLoading = ffmpeg.load({
        coreURL: "/libs/ffmpeg/ffmpeg-core.js",
    });
    try {
        await ffmpegLoading;
        await ffmpeg.exec(['-filters']);
        console.log("FFmpeg loaded successfully");
    } catch (error) {
        // Handle initialization errors if necessary
        console.error("Failed to load FFmpeg:", error);
        ffmpeg = null;
        throw error;
    } finally {
        // Reset the loading tracker
        ffmpegLoading = null;
    }
}

export async function addFileToFFmpeg(file) {
    await loadFFmpeg();
    const { name } = file;
    ffmpeg.writeFile(name, await fetchFile(file));
    return true;
}

function timeToSeconds(match) {
    return parseFloat(match[1]) * 3600 + parseFloat(match[2]) * 60 + parseFloat(match[3]);
}

export async function getDuration(file) {
    const { name } = file;
    const logs = [];
    ffmpeg.on("log", ({ message }) => { logs.push(message); });

    await ffmpeg.exec(["-i", name], { timeout: 10000 });

    const durationRegex = /Duration: (\d+):(\d+):(\d+\.\d+)/;
    const durationMatch = logs.find((log) => log.includes('Duration'));
    let duration = 0;
    if (durationMatch) {
        const match = durationMatch.match(durationRegex);
        // const hours = parseFloat(match[1]);
        // const minutes = parseFloat(match[2]);
        // const seconds = parseFloat(match[3]);
        // duration = hours * 3600 + minutes * 60 + seconds;
        duration = timeToSeconds(match);
    }
    return duration;
}

export async function mergeFiles(files, reencode, onProgress) {
    const inputPaths = [];
    for (const file of files) {
        const { name } = file;
        ffmpeg.writeFile(name, await fetchFile(file));
        const escaped = name.replace(/([\\'\s])/g, '\\$1');
        inputPaths.push(`file ${escaped}`);
    }
    await ffmpeg.writeFile('concat_list.txt', inputPaths.join('\n'));
    const onLog = ({ message }) => { 
        if (message.includes('time=')) {
            const match = message.match(/time=(\d+):(\d+):(\d+\.\d+)/);
            try {
                const seconds = timeToSeconds(match);
                onProgress(seconds);
            } catch (error) {
                console.error("Failed to parse time:", error);
            }
        }
    };
    ffmpeg.on("log", onLog);
    if (reencode) {
        await ffmpeg.exec([
            '-f', 'concat', 
            '-stats_period', '0.2',
            '-safe', '0', 
            '-i', 'concat_list.txt', 
            'output.mp3']);
    } else {
        await ffmpeg.exec([
            '-f', 'concat', 
            '-stats_period', '0.2',
            '-safe', '0', 
            '-i', 'concat_list.txt', 
            '-c', 'copy', 
            'output.mp3']);
    }
    ffmpeg.off("log", onLog);
    const data = await ffmpeg.readFile('output.mp3');
    return new Blob([data.buffer], {
        type: "audio/mp3",
    });
}