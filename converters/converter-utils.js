// Shared utilities for converter pages

// Parse plain text chapter list (same format as the editor)
// Returns array of {title, start (ms), url?}
export function parseTextChapters(text) {
    const lines = text.trim().split('\n');
    const chapters = [];
    for (const line of lines) {
        if (line.trim() === '') continue;
        const match = line.match(/^\(?((?:\d{1,2}:)?\d{1,2}(?::\d{1,2})?(?:\.\d{1,3})?)\)?\s*[-:—–\s]?(.*)/);
        if (match && match.length === 3) {
            const timeString = match[1].trim();
            const title = match[2].trim();
            const start = stringToMs(timeString);
            const chapter = { title, start };
            // extract URL if present at end
            const urlMatch = title.match(/(https?:\/\/[^\s]+)$/);
            if (urlMatch) {
                chapter.url = urlMatch[1];
                chapter.title = title.replace(urlMatch[1], '').trim();
            }
            chapters.push(chapter);
        }
    }
    return chapters;
}

// Parse Podlove XML
export function parsePodloveXml(xml) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    const chapterEls = doc.querySelectorAll('chapter');
    const chapters = [];
    for (const el of chapterEls) {
        const start = stringToMs(el.getAttribute('start'));
        const title = el.getAttribute('title') || '';
        const chapter = { title, start };
        const href = el.getAttribute('href');
        if (href) chapter.url = href;
        const img = el.getAttribute('image');
        if (img) chapter.img = img;
        chapters.push(chapter);
    }
    return chapters;
}

// Parse Podcast Namespace JSON
export function parsePodcastJson(jsonStr) {
    const data = JSON.parse(jsonStr);
    const chaptersArr = data.chapters || data;
    const chapters = [];
    for (const ch of chaptersArr) {
        const chapter = {
            title: ch.title || '',
            start: Math.round((ch.startTime || 0) * 1000),
        };
        if (ch.url) chapter.url = ch.url;
        if (ch.img) chapter.img = ch.img;
        if (ch.toc === false) chapter.toc = false;
        chapters.push(chapter);
    }
    return chapters;
}

// Convert chapters to Podlove XML
export function chaptersToPodlove(chapters) {
    let xml = '<psc:chapters version="1.2" xmlns:psc="http://podlove.org/simple-chapters">\n';
    for (const ch of chapters) {
        const startTime = msToString(ch.start);
        const href = ch.url ? ` href="${escapeXmlAttr(ch.url)}"` : '';
        const img = ch.img ? ` image="${escapeXmlAttr(ch.img)}"` : '';
        xml += `    <psc:chapter start="${startTime}" title="${escapeXmlAttr(ch.title)}"${href}${img} />\n`;
    }
    xml += '</psc:chapters>';
    return xml;
}

// Convert chapters to Podcast Namespace JSON
export function chaptersToJson(chapters) {
    const jsonChapters = chapters.map(ch => {
        const obj = { startTime: ch.start / 1000, title: ch.title };
        if (ch.url) obj.url = ch.url;
        if (ch.img) obj.img = ch.img;
        if (ch.toc === false) obj.toc = false;
        return obj;
    });
    return JSON.stringify({ version: '1.2.0', chapters: jsonChapters }, null, 4);
}

// Convert chapters to plain text list
export function chaptersToText(chapters) {
    return chapters.map(ch => {
        const time = msToStringNoMs(ch.start);
        const url = ch.url ? ` ${ch.url}` : '';
        return `${time} ${ch.title}${url}`;
    }).join('\n');
}

// Time string to milliseconds
function stringToMs(timeString) {
    const clean = timeString.replace(/[^\d:.]/g, '');
    const parts = clean.split(':');
    let hours = 0, minutes = 0, seconds = 0, ms = 0;
    if (parts.length === 3) [hours, minutes, seconds] = parts;
    else if (parts.length === 2) [minutes, seconds] = parts;
    else seconds = parts[0];
    if (String(seconds).includes('.')) {
        const [s, msStr] = String(seconds).split('.');
        seconds = s;
        ms = parseInt(msStr.padEnd(3, '0'));
    }
    return parseInt(hours) * 3600000 + parseInt(minutes) * 60000 + parseInt(seconds) * 1000 + ms;
}

// Milliseconds to time string (with optional ms)
function msToString(milliseconds) {
    const totalSecs = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    const ms = milliseconds % 1000;
    const msStr = ms > 0 ? `.${ms.toString().padEnd(3, '0')}` : '';
    if (hours > 0) {
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}${msStr}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}${msStr}`;
}

// Milliseconds to time string (no ms)
function msToStringNoMs(milliseconds) {
    const totalSecs = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function escapeXmlAttr(str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Download helper
export function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

// Read chapters from MP3 file via ID3 tags
// Returns a Promise that resolves to array of chapter objects
export function readChaptersFromMp3(file) {
    return new Promise((resolve) => {
        window.readTags(file, (tags) => {
            let toc = [];
            if (tags.tableOfContents && tags.tableOfContents.length > 0 && tags.tableOfContents[0].elements) {
                toc = tags.tableOfContents[0].elements;
            }
            if (tags.chapter) {
                const chapters = [];
                for (const ch of tags.chapter) {
                    const chapter = {
                        title: ch.tags?.title || '',
                        start: ch.startTimeMs,
                    };
                    if (ch.tags?.userDefinedUrl) {
                        chapter.url = ch.tags.userDefinedUrl[0].url;
                    }
                    if (toc.length > 0 && !toc.includes(ch.elementID)) {
                        chapter.toc = false;
                    }
                    chapters.push(chapter);
                }
                resolve(chapters);
            } else {
                resolve([]);
            }
        });
    });
}
