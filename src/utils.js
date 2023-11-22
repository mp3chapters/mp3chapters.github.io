export function secondsToString(seconds, showHours = false) {
    seconds = Math.floor(seconds);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const paddedHours = hours.toString().padStart(2, '0');
    const paddedMinutes = minutes.toString().padStart(2, '0');
    const paddedSeconds = secs.toString().padStart(2, '0');

    if (showHours || hours > 0) {
        return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
    } else {
        return `${paddedMinutes}:${paddedSeconds}`;
    }
}

export function stringToSeconds(timeString) {
    const parts = timeString.split(':').map(part => parseInt(part, 10));
    if (parts.length === 3) {
        return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
    } else if (parts.length === 2) {
        return (parts[0] * 60) + parts[1];
    } else {
        throw new Error('Invalid time format');
    }
}