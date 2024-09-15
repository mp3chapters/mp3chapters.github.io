This is https://ffmpegwasm.netlify.app/
Used for finding the duration of an mp3 file, and for merging mp3 files (either copying or re-encoding).

Built to only include what is necessary for mp3 processing, with the changes made in the repo:
https://github.com/mp3chapters/ffmpeg.wasm/
(run `make prd`)

ESM modules bundled into single files using command
```bash
esbuild index.js --bundle --outfile=bundle.js --format=esm
```
for `ffmpeg/classes.js`, `ffmpeg/worker.js`, and `util/index.js`
