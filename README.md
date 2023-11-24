# mp3chapters.github.io

Online tool for adding chapters and other `id3`` tags to audio files such as podcasts. Available at [mp3chapters.github.io](https://mp3chapters.github.io).

Uses just HTML/CSS and vanilla JS. No server-side code, so it can be run by just starting a webserver in the repo directory (e.g. `python3 -m http.server`).

Built using [node-id3](https://github.com/Zazama/node-id3), [browserify](https://browserify.org/), [wavesurfer.js](https://wavesurfer-js.org/), and [Vidstack Player](https://vidstack.io/docs).

Features:
* Add chapters using the player, which displays a waveform and the current chapters.
* Add chapters manually using a straightforward text interface.
* Uses the same format as YouTube chapters in video descriptions, and is compatible with Spotify episode description chapters.
* Chapters can be given chapter links and chapter images.
* Works with both seconds or millisecond precision.
* Export to mp3 with id3 tags.
* Export to Podlove Simple Chapters XML format.
* Allows editing other id3 tags such as title, artist, copyright, and cover art image.