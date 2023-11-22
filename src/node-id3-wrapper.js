// convert using command
//   `browserify src/node-id3-wrapper.js > node-id3-browserify.js`
// or
//   `browserify -g @browserify/uglifyify src/node-id3-wrapper.js > node-id3-browserify.js`

const NodeID3 = require('node-id3');

// Function to read a file as a buffer
function readFileAsBuffer(file, callback) {
    const reader = new FileReader();
    reader.onload = function (e) {
        callback(Buffer.from(e.target.result));
    };
    reader.readAsArrayBuffer(file);
}

// Function to add tags to an MP3 buffer and return a new buffer
function addTags(tags, mp3file, callback) {
    readFileAsBuffer(mp3file, function (buffer) {
        const taggedBuffer = NodeID3.write(tags, buffer);
        callback(taggedBuffer);
    });
}

function readTags(mp3file, callback) {
    readFileAsBuffer(mp3file, function (buffer) {
        const tags = NodeID3.read(buffer);
        callback(tags);
    });
}

window.addTags = addTags;
window.readTags = readTags;