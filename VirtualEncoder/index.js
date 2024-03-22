const childProcess = require('child_process');
const { resolve } = require('path');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const path = require("path");
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

const streamToMux = (filePath, context) => {
    return new Promise(async (resolve, reject) => {
        context.log(`Running ffmpeg from ${ffmpegPath}`);

        //var inputAbsolutePath = path.resolve("./input.mp4");

        // ffmpeg -re -i myfile_1.mp4 -r 30 -c:v libx264 -x264-params keyint=60:scenecut=0 -preset fast -b:v 5M -maxrate 6M -bufsize 3M -threads 4 -f flv rtmp://global-live.mux.com:5222/app/{my_stream_key}
        const child = childProcess.spawn(
            ffmpegPath,
            // note, args must be an array when using spawn
            ['-i', `${filePath}`, '-f', 'flv', 'rtmp://global-live.mux.com:5222/app/5ac28812-8320-0c76-2ba2-313288af035f'],
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

const downloadFromMuxToFileSystem = async (url, filePath, context) => {
    const writer = fs.createWriteStream(filePath);
    
    context.log("Downloading asset from Mux");

    const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream'
    });

    context.log("Writing asset to file system");

    response.data.pipe(writer);

    context.log("Saved on file system");

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

module.exports = async function (context, myQueueItem) {
    context.log('JavaScript queue trigger function processing work item', myQueueItem);

    // 2. Process the message here
    context.log('Starting streaming blob');

    const url = "https://master.mux.com/qENtrEqJz7SSsoTGkp6O9NMNyR6u2YMz/master.mp4?skid=default&signature=NjVmZjFjZDZfNWVlM2JiYzcyYjRhZmJkY2U5NWEwODU5YzViZjI5MzhiNTUxOGY3NGU1ZjVkNTQxZTJiNTFkN2U2NjlhNGI2OA==";
    const tempDir = os.tmpdir();
    const outputDir = path.join(tempDir, `downloaded_file`);
    fs.mkdirSync(outputDir, { recursive: true });
    const filePath = path.join(outputDir, 'downloaded_file.mp4')

    await downloadFromMuxToFileSystem(url, filePath, context)
    .then(() => {
        context.log('File downloaded successfully');
    })
    .catch((error) => {
        context.error('Error downloading file:', error);
        throw 'Error downloading file:' + error;
    });

    var finished = await streamToMux(filePath, context);

    context.log("Finished execution", finished);
};