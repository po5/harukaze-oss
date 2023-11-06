import config from '../../config.json'
import { execFile } from 'child_process'
import { FFprobeProbeResult } from './ffmpeg.util'

/**
 * Generates a thumbnail from the provided image or video file, and writes it to the provided output path
 * @param inputPath The path of the image or video to process
 * @param outputPath The path to write the generated thumbnail
 */
export async function generateThumbnail(inputPath: string, outputPath: string) {
    await new Promise<void>((res, rej) => {
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
            if((code || 0) > 0)
                rej('FFmpeg exited with code '+code)
            else
                res()
        })
    })
}

/**
 * Generates an avatar from the provided image
 * @param inputPath The path of the image to process
 * @param outputPath The path to write the generated avatar
 */
export async function generateAvatar(inputPath: string, outputPath: string) {
    await new Promise<void>((res, rej) => {
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

        proc.stderr?.on('data', d => console.error(d))

        proc.on('close', code => {
            if((code || 0) > 0)
                rej('FFmpeg exited with code '+code)
            else
                res()
        })
    })
}

/**
 * Generates a mood image from the provided image
 * @param inputPath The path of the image to process
 * @param outputPath The path to write the generated avatar
 */
export async function generateMood(inputPath: string, outputPath: string) {
    await new Promise<void>((res, rej) => {
        let proc = execFile(config.ffmpeg.ffmpegPath, [
            '-i', inputPath,
            '-vf', 'scale=100:100',
            '-vframes', '1',
            '-an',
            outputPath,
            '-y'
        ])

        proc.stderr?.on('data', d => console.error(d))

        proc.on('close', code => {
            if((code || 0) > 0)
                rej('FFmpeg exited with code '+code)
            else
                res()
        })
    })
}

/**
 * Generates scales an image
 * @param inputPath The path of the image to scale
 * @param width The width (use -1 or null to maintain aspect ratio)
 * @param height The height (use -1 or null to maintain aspect ratio)
 * @param outputPath The path to write the scaled image
 */
export async function scaleImage(inputPath: string, width: number | null, height: number | null, outputPath: string) {
    await new Promise<void>((res, rej) => {
        let proc = execFile(config.ffmpeg.ffmpegPath, [
            '-i',
            inputPath,
            '-vf', `scale=min'('${width || -1}\\, iw')':min'('${height || -1}\\, ih')'`,
            outputPath,
            '-y'
        ])

        proc.on('close', code => {
            if((code || 0) > 0)
                rej('FFmpeg exited with code '+code)
            else
                res()
        })
    })
}

/**
 * Probes a file using FFprobe and returns its result as JSON
 * @param path The path of the file to probe
 * @returns The probe result
 */
export async function probeFile(path: string): Promise<FFprobeProbeResult> {
    return await new Promise<FFprobeProbeResult>((res, rej) => {
        let proc = execFile(config.ffmpeg.ffprobePath, [
            '-v', 'quiet',
            '-print_format', 'json',
            '-show_format',
            '-show_streams',
            path
        ])

        // Collect output
        let stdout = ''
        proc.stdout?.on('data', data => stdout += data.toString())

        proc.on('close', code => {
            try {
                if((code || 0) > 0)
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
 * Media dimensions
 */
export type MediaDimensions = {
    /**
     * The media width, in pixels
     */
    width: number,
    /**
     * The media height, in pixels
     */
    height: number
}

/**
 * Returns a file's dimensions from a probe result
 * @param result The probe result to search
 * @returns The file's dimensions, or null if they cannot be determined
 */
export function getDimensionsFromProbeResult(result: FFprobeProbeResult): MediaDimensions | null {
    const streams = (result || {}).streams

    // If there are no streams, return null
    if(!streams)
        return null

    // Loop through streams and find the first with dimensions in it
    for(const stream of streams) {
        if(typeof stream.width === 'number' && typeof stream.height === 'number') {
            return {
                width: stream.width,
                height: stream.height
            }
        }
    }

    // If nothing was returned at this point, return null; there is no stream with dimensions
    return null
}

/**
 * Probes a file using FFprobe and returns its dimensions, if available
 * @param path The path of the file to probe
 * @returns The file's dimensions, or null if they cannot be determined
 */
export async function probeFileForDimensions(path: string): Promise<MediaDimensions | null> {
    return getDimensionsFromProbeResult(await probeFile(path))
}