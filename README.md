# mp3chapters.github.io

Online tool for adding chapters and other `id3`` tags to audio files such as podcasts. Available at [mp3chapters.github.io](https://mp3chapters.github.io).

Uses just HTML/CSS and vanilla JS. No server-side code, so it can be run by just starting a webserver in the repo directory (e.g. `python3 -m http.server`).

Built using [node-id3](https://github.com/Zazama/node-id3), [browserify](https://browserify.org/), [wavesurfer.js](https://wavesurfer-js.org/), and [Vidstack Player](https://vidstack.io/docs).

Feedback, bug reports, and pull requests are very welcome.

Features:
* Add chapters using the player, which displays a waveform and the current chapters.
* Add chapters manually using a straightforward text interface.
* Uses the same format as YouTube chapters in video descriptions, and is compatible with Spotify episode description chapters.
* Chapters can be given chapter links and chapter images.
* Works with both seconds or millisecond precision.
* Export to mp3 with id3 tags.
* Export to Podlove Simple Chapters XML format.
* Allows editing other id3 tags such as title, artist, copyright, and cover art image.

[<img width="1449" alt="Screenshot 2023-11-24 at 12 49 30" src="https://github.com/mp3chapters/mp3chapters.github.io/assets/3543224/55b986ed-ddd0-462d-9854-555c3115dc80">](https://mp3chapters.github.io)
