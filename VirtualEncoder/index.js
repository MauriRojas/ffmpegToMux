const childProcess = require('child_process');
const { resolve } = require('path');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const path = require("path");

const streamToMux = (context) => {
    return new Promise(async (resolve, reject) => {
        context.log(`Running ffmpeg from ${ffmpegPath}`);

        var inputAbsolutePath = path.resolve("./input.mp4");

        // ffmpeg -re -i myfile_1.mp4 -r 30 -c:v libx264 -x264-params keyint=60:scenecut=0 -preset fast -b:v 5M -maxrate 6M -bufsize 3M -threads 4 -f flv rtmp://global-live.mux.com:5222/app/{my_stream_key}
        const child = childProcess.spawn(
            ffmpegPath,
            // note, args must be an array when using spawn
            ['-i', `${inputAbsolutePath}`, '-f', 'flv', 'rtmp://global-live.mux.com:5222/app/5ac28812-8320-0c76-2ba2-313288af035f'],
            {
                windowsVerbatimArguments: true,
            }
        );

        child.stdout.on('data', (data) => {
            context.log(`stdout: ${data}`);
        });

        child.stderr.on('data', (data) => {
            context.log(`stderr: ${data}`);
        });

        child.on('error', (error) => {
            // catches execution error (bad file)
            context.log(`Error executing binary: ${ffmpegPath}`);
            reject(error);
        });

        child.on('close', (code) => {
            context.log(`Process exited with code: ${code}`);
            if (code === 0) {
                context.log("Finished gracefully");
                resolve('Streamed successfully')
            } else {
                context.log(`FFmpeg encountered an error, check the console output`);
                console.log(child);
                reject(`FFmpeg encountered an error, check the console output`);
            }
        });
    });
};

module.exports = async function (context, myQueueItem) {
    context.log('JavaScript queue trigger function processing work item', myQueueItem);

    // 2. Process the message here
    context.log('Starting streaming blob');

    var finished = await streamToMux(context);

    context.log("Finished execution", finished);
};