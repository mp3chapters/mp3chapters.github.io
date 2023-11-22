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
    // Remove any non-numeric and non-colon characters (e.g., parentheses)
    const cleanedTimeString = timeString.replace(/[^0-9:]/g, '');

    // Split the time string into parts
    const parts = cleanedTimeString.split(':').map(part => parseInt(part, 10));

    // Check for invalid or empty parts
    if (parts.some(isNaN) || parts.length === 0 || parts.length > 3) {
        throw new Error('Invalid time format');
    }

    // Calculate seconds based on the number of parts
    if (parts.length === 3) {
        // Format HH:MM:SS
        return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
    } else if (parts.length === 2) {
        // Format MM:SS
        return (parts[0] * 60) + parts[1];
    } else {
        // Format SS
        return parts[0];
    }
}