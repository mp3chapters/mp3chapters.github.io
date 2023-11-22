import { secondsToString } from './utils.js';

export class ChapterList {
    constructor() {
        this.chapters = [];
        this.eventListeners = [];
        this._duration = -1;
        this.addChapter('Introduction', 0);
    }

    set duration(newDuration) {
        this._duration = newDuration;
        this.setChapters(this.chapters);
    }

    get duration() {
        return this._duration;
    }

    // Method to get chapters
    getChapters() {
        return this.chapters;
    }

    // Method to set chapters
    setChapters(newChapters) {
        // Sort the chapters by their start time
        this.chapters = newChapters.sort((a, b) => a.start - b.start);
    
        // Update the end time of each chapter to match the start time of the next chapter
        for (let i = 0; i < this.chapters.length - 1; i++) {
            this.chapters[i].end = this.chapters[i + 1].start;
        }

        // Update the end time of the last chapter to match the duration of the video
        if (this.chapters.length > 0) {
            this.chapters[this.chapters.length - 1].end = this.duration;
        }
    
        this.triggerEventListeners();
    }    

    addChapter(title, start) {
        const newChapter = { title, start, end: undefined };
        this.chapters.push(newChapter);
        this.setChapters(this.chapters);
    }
    
    exportAsPodlove() {
        let xmlChapters = '<psc:chapters version="1.2" xmlns:psc="http://podlove.org/simple-chapters">\n';

        this.chapters.forEach(chapter => {
            const startTime = secondsToString(chapter.start);
            xmlChapters += `    <psc:chapter start="${startTime}" title="${chapter.title}" />\n`;
        });

        xmlChapters += '</psc:chapters>';

        return xmlChapters;
    }

    // Method to add an event listener
    addEventListener(listener) {
        this.eventListeners.push(listener);
    }

    // Method to trigger event listeners
    triggerEventListeners() {
        this.eventListeners.forEach(listener => listener(this.chapters));
    }
}