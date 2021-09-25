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
            '-vf', 'scale=-2:180',
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

/**
 * Generates an avatar from the provided image
 * @param {string} inputPath The path of the image to process
 * @param {string} outputPath The path to write the generated avatar
 */
async function generateAvatar(inputPath, outputPath) {
    await new Promise((res, rej) => {
        let args = [
            '-i', inputPath,
            '-vf', 'scale=128:128'
        ]

        if(inputPath.endsWith('.gif'))
            args.push(...[
                '-lossless', '0',
                '-compression_level', '5',
                '-loop', '0',
                '-q:v', '70'
            ])
        else
            args.push(...[
                '-vframes', '1',
                '-an'
            ])
        args.push(...[
            outputPath,
            '-y'
        ])

        let proc = execFile(config.ffmpeg.ffmpegPath, args)

        proc.stderr.on('data', d => console.error(d))

        proc.on('close', code => {
            if(code > 0)
                rej('FFmpeg exited with code '+code)
            else
                res()
        })
    })
}

/**
 * Generates a mood image from the provided image
 * @param {string} inputPath The path of the image to process
 * @param {string} outputPath The path to write the generated avatar
 */
 async function generateMood(inputPath, outputPath) {
    await new Promise((res, rej) => {
        let proc = execFile(config.ffmpeg.ffmpegPath, [
            '-i', inputPath,
            '-vf', 'scale=100:100',
            '-vframes', '1',
            '-an',
            outputPath,
            '-y'
        ])

        proc.stderr.on('data', d => console.error(d))

        proc.on('close', code => {
            if(code > 0)
                rej('FFmpeg exited with code '+code)
            else
                res()
        })
    })
}

/**
 * Generates scales an image
 * @param {string} inputPath The path of the image to scale
 * @param {?number} width The width (use -1 or null to maintain aspect ratio)
 * @param {?number} height The height (use -1 or null to maintain aspect ratio)
 * @param {string} outputPath The path to write the scaled image
 */
async function scaleImage(inputPath, width, height, outputPath) {
    await new Promise((res, rej) => {
        let proc = execFile(config.ffmpeg.ffmpegPath, [
            '-i',
            inputPath,
            '-vf', `scale=min'('${width*1 || -1}\\, iw')':min'('${height*1 || -1}\\, ih')'`,
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

/**
 * Probes a file using FFprobe and returns its result as JSON
 * @param {string} path The path of the file to probe
 * @return {Promise<Object>} The probe result
 */
async function probeFile(path) {
    return await new Promise((res, rej) => {
        let proc = execFile(config.ffmpeg.ffprobePath, [
            '-v', 'quiet',
            '-print_format', 'json',
            '-show_format',
            '-show_streams',
            path
        ])

        // Collect output
        let stdout = ''
        proc.stdout.on('data', data => stdout += data.toString())

        proc.on('close', code => {
            try {
                if(code > 0)
                    rej('FFmpeg exited with code ' + code)
                else
                    res(JSON.parse(stdout))
            } catch(err) {
                rej(err)
            }
        })
    })
}

/**
 * @typedef {Object} MediaDimensions
 * @property {number} width The media's width
 * @property {number} height The media's height
 */

/**
 * Returns a file's dimensions from a probe result
 * @param {?Object} result The probe result to search
 * @return {?MediaDimensions} The file's dimensions, or null if they cannot be determined
 */
function getDimensionsFromProbeResult(result) {
    const streams = (result || {}).streams
    if(streams instanceof Array && streams.length > 0) {
        const stream = streams[0]

        if(typeof stream.width === 'number' && typeof stream.height === 'number') {
            return {
                width: stream.width,
                height: stream.height
            }
        }
    }

    return null
}

/**
 * Probes a file using FFprobe and returns its dimensions, if available
 * @param {string} path The path of the file to probe
 * @return {Promise<?MediaDimensions>} The file's dimensions, or null if they cannot be determined
 */
async function probeFileForDimensions(path) {
    return getDimensionsFromProbeResult(await probeFile(path))
}

/* Export functions */
module.exports.generateThumbnail = generateThumbnail
module.exports.generateAvatar = generateAvatar
module.exports.generateMood = generateMood
module.exports.scaleImage = scaleImage
module.exports.probeFile = probeFile
module.exports.getDimensionsFromProbeResult = getDimensionsFromProbeResult
module.exports.probeFileForDimensions = probeFileForDimensions