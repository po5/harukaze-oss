import { open, writeFile } from 'fs/promises'
import { format } from 'util'
import { sleep } from './misc.util'

// Old logging functions
let oldLog = console.log
let oldError = console.error

// The current message write queues
const stdoutQueue: string[] = []
const stderrQueue: string[] = []

/**
 * Initializes the logging queue
 */
async function initQueue() {
	// Open log and error files
	let stdout = await open('stdout.log', 'a')
	let stderr = await open('stderr.log', 'a')

	async function writeQueue(err: boolean) {
		// Choose streams and queues based on whether the message is directed towards stderr or not
		const stream = err ? stderr : stdout
		const queue = err ? stderrQueue : stdoutQueue

		while(queue.length > 0) {
			const str = queue[0] + '\n'

			try {
				await writeFile(stream, str)
			} catch(e) {
				oldError(`Error occurred while writing message to std${err ? 'err' : 'out'} log:`)
				oldError(e)
			}

			queue.splice(0, 1)
		}
	}
	async function queue() {
		while(true) {
			await sleep(250)

			if(stdoutQueue.length > 0)
				await writeQueue(false)
			if(stderrQueue.length > 0)
				await writeQueue(true)
		}
	}

	// Launch queue
	queue().finally()
}

/**
 * Initializes the global logger
 */
export async function init() {
	function dataToStr(...data: any) {
		if(data.length > 0) {
			const first = data[0]
			let str: string
			if(typeof first == 'string') {
				str = format(...data)
			} else if(first instanceof Error) {
				str = first.stack as string
			} else {
				str = ''
				for(let part of data) {
					if(part === undefined)
						str += 'undefined'
					else if(part === null)
						str += 'null'
					else
						str += part.toString()
				}
			}

			return str
		} else {
			return ''
		}
	}

	// New log function
	function newLog(...data: any) {
		let str = dataToStr(data)
		stdoutQueue.push(new Date().toISOString()+' | '+str)
		oldLog(...data)
	}

	// New error function
	function newError(...data: any) {
		let str = dataToStr(data)
		stderrQueue.push(str)
		oldError(...data)
	}

	// Initialize write queue
	await initQueue()

	// Replace functions
	console.log = newLog
	console.error = newError
}