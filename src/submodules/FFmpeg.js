import { fetchFile } from '../../libs/ffmpeg/util.js';
import { FFmpeg } from '../../libs/ffmpeg/ffmpeg.js';

// --- Merge core (existing) ---
let ffmpeg = null;
let ffmpegLoading = null;

export async function loadFFmpeg() {
    if (ffmpeg) return;
    if (ffmpegLoading) { await ffmpegLoading; return; }
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
        console.error("Failed to load FFmpeg:", error);
        ffmpeg = null;
        throw error;
    } finally {
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

// --- M4B core ---
let ffmpegM4B = null;
let ffmpegM4BLoading = null;

async function loadFFmpegM4B() {
    if (ffmpegM4B) return;
    if (ffmpegM4BLoading) { await ffmpegM4BLoading; return; }
    ffmpegM4B = new FFmpeg();
    ffmpegM4B.on("log", ({ message }) => {
        // console.log("m4b:", message);
    });
    ffmpegM4BLoading = ffmpegM4B.load({
        coreURL: "/libs/ffmpeg-m4b/ffmpeg-core.js",
    });
    try {
        await ffmpegM4BLoading;
        console.log("FFmpeg M4B loaded successfully");
    } catch (error) {
        console.error("Failed to load FFmpeg M4B:", error);
        ffmpegM4B = null;
        throw error;
    } finally {
        ffmpegM4BLoading = null;
    }
}

export async function convertToM4B(mp3Blob) {
    await loadFFmpegM4B();
    const mp3Data = new Uint8Array(await mp3Blob.arrayBuffer());
    await ffmpegM4B.writeFile('input.mp3', mp3Data);
    await ffmpegM4B.exec([
        '-i', 'input.mp3',
        '-map', '0:a', '-map', '0:v?',
        '-c:a', 'aac', '-b:a', '128k',
        '-c:v', 'copy',
        'output.m4b'
    ]);
    const data = await ffmpegM4B.readFile('output.m4b');
    // Clean up
    await ffmpegM4B.deleteFile('input.mp3');
    await ffmpegM4B.deleteFile('output.m4b');
    return new Blob([data.buffer], { type: "audio/mp4" });
}

// --- Video core ---
let ffmpegVideo = null;
let ffmpegVideoLoading = null;

async function loadFFmpegVideo() {
    if (ffmpegVideo) return;
    if (ffmpegVideoLoading) { await ffmpegVideoLoading; return; }
    ffmpegVideo = new FFmpeg();
    ffmpegVideo.on("log", ({ message }) => {
        console.log("video:", message);
    });
    ffmpegVideoLoading = ffmpegVideo.load({
        coreURL: "/libs/ffmpeg-video/ffmpeg-core.js",
    });
    try {
        await ffmpegVideoLoading;
        console.log("FFmpeg Video loaded successfully");
    } catch (error) {
        console.error("Failed to load FFmpeg Video:", error);
        ffmpegVideo = null;
        throw error;
    } finally {
        ffmpegVideoLoading = null;
    }
}

/**
 * Render an image (or black frame) onto a canvas at the target resolution, return PNG Uint8Array.
 */
function renderFrame(image, width, height) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Black background
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);

        if (!image) {
            canvas.toBlob((blob) => {
                blob.arrayBuffer().then(buf => resolve(new Uint8Array(buf)));
            }, 'image/png');
            return;
        }

        const img = new Image();
        img.onload = () => {
            // Fit image centered, preserving aspect ratio
            const scale = Math.min(width / img.width, height / img.height);
            const w = img.width * scale;
            const h = img.height * scale;
            ctx.drawImage(img, (width - w) / 2, (height - h) / 2, w, h);
            URL.revokeObjectURL(img.src);
            canvas.toBlob((blob) => {
                blob.arrayBuffer().then(buf => resolve(new Uint8Array(buf)));
            }, 'image/png');
        };
        const blob = new Blob([image.imageBuffer], { type: image.mime });
        img.src = URL.createObjectURL(blob);
    });
}

/**
 * Determine video resolution based on chapter images.
 * 1080p if all images have height >= 1080, otherwise 720p.
 */
function chooseResolution(images) {
    const validImages = images.filter(img => img != null);
    if (validImages.length === 0) return { width: 1280, height: 720 };

    // Check heights by loading images
    // We do a simpler check: if all imageBuffers decode to >= 1080px height, use 1080p
    // But since we can't synchronously check, we'll return a promise
    return new Promise((resolve) => {
        let checked = 0;
        let all1080 = true;
        if (validImages.length === 0) { resolve({ width: 1280, height: 720 }); return; }
        for (const image of validImages) {
            const img = new Image();
            img.onload = () => {
                if (img.height < 1080) all1080 = false;
                URL.revokeObjectURL(img.src);
                checked++;
                if (checked === validImages.length) {
                    resolve(all1080 ? { width: 1920, height: 1080 } : { width: 1280, height: 720 });
                }
            };
            img.onerror = () => {
                all1080 = false;
                checked++;
                if (checked === validImages.length) {
                    resolve({ width: 1280, height: 720 });
                }
            };
            const blob = new Blob([image.imageBuffer], { type: image.mime });
            img.src = URL.createObjectURL(blob);
        }
    });
}

export async function createVideo(mp3Blob, chapters, chapterImages, coverImage, onProgress) {
    await loadFFmpegVideo();

    // Build list of images per chapter (fallback: cover → null for black)
    const imagePerChapter = chapters.map(ch => {
        if (ch.imageId !== undefined && chapterImages[ch.imageId]) {
            return chapterImages[ch.imageId];
        }
        return coverImage && coverImage !== "deleted" ? coverImage : null;
    });

    const { width, height } = await chooseResolution(imagePerChapter);

    // Create frames directory
    try { await ffmpegVideo.createDir('frames'); } catch (e) { /* may already exist */ }

    const concatLines = [];
    for (let i = 0; i < chapters.length; i++) {
        const ch = chapters[i];
        const frameData = await renderFrame(imagePerChapter[i], width, height);
        const frameName = `frames/frame_${String(i).padStart(4, '0')}.png`;
        await ffmpegVideo.writeFile(frameName, frameData);

        const durationSec = (ch.end - ch.start) / 1000;
        concatLines.push(`file '${frameName}'`);
        if (i < chapters.length - 1) {
            concatLines.push(`duration ${durationSec}`);
        }
    }
    // Repeat last frame (concat demuxer quirk)
    if (chapters.length > 0) {
        const lastFrame = `frames/frame_${String(chapters.length - 1).padStart(4, '0')}.png`;
        concatLines.push(`duration ${(chapters[chapters.length - 1].end - chapters[chapters.length - 1].start) / 1000}`);
        concatLines.push(`file '${lastFrame}'`);
    }

    await ffmpegVideo.writeFile('concat.txt', concatLines.join('\n'));

    // Write audio
    const mp3Data = new Uint8Array(await mp3Blob.arrayBuffer());
    await ffmpegVideo.writeFile('audio.mp3', mp3Data);

    // Progress logging
    const onLog = ({ message }) => {
        if (onProgress && message.includes('time=')) {
            const match = message.match(/time=(\d+):(\d+):(\d+\.\d+)/);
            if (match) {
                onProgress(timeToSeconds(match));
            }
        }
    };
    ffmpegVideo.on("log", onLog);

    await ffmpegVideo.exec([
        '-f', 'concat', '-safe', '0', '-i', 'concat.txt',
        '-i', 'audio.mp3',
        '-vf', `fps=1,format=yuv420p`,
        '-c:v', 'libx264', '-crf', '28',
        '-c:a', 'aac', '-b:a', '128k',
        '-shortest',
        '-stats_period', '0.2',
        'output.mp4'
    ]);

    ffmpegVideo.off("log", onLog);
    const data = await ffmpegVideo.readFile('output.mp4');

    // Clean up
    for (let i = 0; i < chapters.length; i++) {
        const frameName = `frames/frame_${String(i).padStart(4, '0')}.png`;
        try { await ffmpegVideo.deleteFile(frameName); } catch (e) { }
    }
    try { await ffmpegVideo.deleteFile('concat.txt'); } catch (e) { }
    try { await ffmpegVideo.deleteFile('audio.mp3'); } catch (e) { }
    try { await ffmpegVideo.deleteFile('output.mp4'); } catch (e) { }

    return new Blob([data.buffer], { type: "video/mp4" });
}
