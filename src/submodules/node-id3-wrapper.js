// convert using command
//   `browserify src/node-id3-wrapper.js > node-id3-browserify.js`
// or
//   `browserify -g @browserify/uglifyify src/node-id3-wrapper.js > node-id3-browserify.js`
// if needed, run `cd node_modules/node-id3 && npm install && npm run build` to build the node-id3 module

const NodeID3 = require('node-id3');

function convertUint8ArraysToBuffers(obj) {
    // Check if the argument is an object and not null
    if (typeof obj === 'object' && obj !== null) {
        // Iterate through each key in the object
        Object.keys(obj).forEach(key => {
            const value = obj[key];
            // If the value is an Uint8Array, convert it to a Buffer
            if (value instanceof Uint8Array) {
                obj[key] = Buffer.from(value);
            }
            // If the value is an object, apply the function recursively
            else if (typeof value === 'object') {
                convertUint8ArraysToBuffers(value);
            }
        });
    }
}

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
        convertUint8ArraysToBuffers(tags);
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