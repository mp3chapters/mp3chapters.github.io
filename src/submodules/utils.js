export function secondsToStringWithoutMilliseconds(milliseconds) {
    // used for Spotify/YouTube export
    const seconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const paddedHours = hours.toString().padStart(2, '0');
    const paddedMinutes = minutes.toString().padStart(2, '0');
    const paddedSeconds = secs.toString().padStart(2, '0');

    return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
}

export function secondsToString(milliseconds, showHours = false) {
    const seconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const ms = milliseconds % 1000;

    const paddedHours = hours.toString().padStart(2, '0');
    const paddedMinutes = minutes.toString().padStart(2, '0');
    const paddedSeconds = secs.toString().padStart(2, '0');
    const paddedMs = ms.toString().padEnd(3, '0');
    const MsString = ms > 0 || window.chapters.usesMs ? `.${paddedMs}` : '';

    if (showHours || hours > 0) {
        return `${paddedHours}:${paddedMinutes}:${paddedSeconds}${MsString}`;
    } else {
        return `${paddedMinutes}:${paddedSeconds}${MsString}`;
    }
}

export function stringToSeconds(timeString) {
    // Remove non-relevant characters
    const cleanString = timeString.replace(/[^\d:.]/g, '');

    // Split the string by colon
    const parts = cleanString.split(':');

    // Error handling for excessive parts
    if (parts.length > 3) {
        throw new Error("Invalid time format: too many parts.");
    }

    let hours = 0, minutes = 0, seconds = 0, milliseconds = 0;
    let msecPart = '';

    // Parse the time parts based on their count
    if (parts.length === 3) {
        [hours, minutes, seconds] = parts;
    } else if (parts.length === 2) {
        [minutes, seconds] = parts;
    } else {
        seconds = parts[0];
    }

    // Validate and split seconds and milliseconds
    if (seconds.includes('.')) {
        [seconds, msecPart] = seconds.split('.');

        // Validate millisecond digits
        if (msecPart.length > 3) {
            throw new Error("Invalid time format: too many millisecond digits.");
        }

        milliseconds = msecPart.padEnd(3, '0');
    }

    // Convert to integers
    hours = parseInt(hours);
    minutes = parseInt(minutes);
    seconds = parseInt(seconds);
    milliseconds = parseInt(milliseconds);

    // Validate seconds
    if (seconds > 59) {
        throw new Error("Invalid time format: seconds are too high.");
    }

    // Calculate total milliseconds
    return (hours * 3600000) + (minutes * 60000) + (seconds * 1000) + milliseconds;
}