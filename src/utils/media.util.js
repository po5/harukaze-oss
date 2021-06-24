const config = require('../../config.json')
const { execFile } = require('child_process')

/**
 * Generates a thumbnail from the provided image or video file, and writes it to the provided output path
 * @param {string} inputPath The path of the image or video to process
 * @param {string} outputPath The path to write the generated thumbnail
 */
async function generateThumbnail(inputPath, outputPath) {
    await new Promise((res, rej) => {
        let proc = execFile(config.ffmpeg.ffmpegPath, [
            '-i',
            inputPath,
            '-vf', 'scale=-2:150',
            '-vframes', '1',
            '-an',
            outputPath,
            '-y'
        ])

        proc.on('close', code => {
            if(code > 0)
                rej('FFmpeg exited with code '+code)
            else
                res()
        })
    })
}

/* Export functions */
module.exports.generateThumbnail = generateThumbnail