const childProcess = require('child_process');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

module.exports = async function (context, myQueueItem) {
    context.log('JavaScript queue trigger function processing work item', myQueueItem);

    // 2. Process the message here
    context.log('Starting streaming blob');

    // ffmpeg -re -i myfile_1.mp4 -r 30 -c:v libx264 -x264-params keyint=60:scenecut=0 -preset fast -b:v 5M -maxrate 6M -bufsize 3M -threads 4 -f flv rtmp://global-live.mux.com:5222/app/{my_stream_key}
    const child = childProcess.spawn(
        ffmpegPath,
        // note, args must be an array when using spawn
        ['-re', '-i', 'https://jobssa.blob.core.windows.net/mp4?sp=r&st=2024-03-21T16:40:56Z&se=2024-03-22T00:40:56Z&spr=https&sv=2022-11-02&sr=c&sig=Avyr6lhXlpBdH6iK3X5hlRyrJ%2FJx0nPxkPeBYsFbAZg%3D', '-r', '30', '-c:v', 'libx264', '-x264-params', 'keyint=60:scenecut=0', '-preset', 'fast', '-b:v', '5M', '-maxrate', '6M', '-bufsize', '3M', '-threads', '4', '-f', 'flv', 'rtmp://global-live.mux.com:5222/app/5ac28812-8320-0c76-2ba2-313288af035f'],
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

    child.on('error', () => {
        // catches execution error (bad file)
        context.log(`Error executing binary: ${ffmpegPath}`);
        throw "error while running ffmpeg";
    });

    child.on('close', (code) => {
        context.log(`Process exited with code: ${code}`);
        if (code === 0) {
            resolve(outputDir);
        } else {
            context.log(`FFmpeg encountered an error, check the console output`);
        }
    });

    context.log("Message processed, testing image from local environment");
};