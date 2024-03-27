const childProcess = require('child_process');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

const streamToMux = (context, message) => {
    return new Promise(async (resolve, reject) => {
        context.log(`Running ffmpeg from ${ffmpegPath}`);

        context.log(`Asset source is ${message.assetPath}`);

        var currentTime = new Date().getTime();

        var startOffset = Math.floor((currentTime - message.classStartTime) / 1000);

        // ffmpeg -i myfile_1.mp4 -f flv rtmp://global-live.mux.com:5222/app/{my_stream_key}
        const child = childProcess.spawn(
            ffmpegPath,
            // note, args must be an array when using spawn
            ['-ss', `${startOffset}`, '-i', `${message.assetPath}`, '-f', 'flv', 'rtmp://global-live.mux.com:5222/app/5ac28812-8320-0c76-2ba2-313288af035f'],
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
                reject(`FFmpeg encountered an error, check the console output`);
            }
        });
    });
};

module.exports = async function (context, queueMessage) {
    context.log('JavaScript queue trigger function processing work item', queueMessage);

    // 2. Process the message here
    context.log('Starting streaming asset');

    try {
        var finished = await streamToMux(context, queueMessage);
    } catch (error) {
        context.log("Error while streaming to Mux " + error);
    }

    context.log("Finished execution", finished);
};