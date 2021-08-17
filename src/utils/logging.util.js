const fs = require('fs')
const { format, promisify } = require('util')
const { sleep } = require('./misc.util')
const open = promisify(fs.open)
const write = promisify(fs.write)

// Old logging functions
let oldLog = console.log
let oldError = console.error

// The current message write queues
const stdoutQueue = []
const stderrQueue = []

async function initQueue() {
	// Open log and error files
	let stdout = await open('stdout.log', 'a')
	let stderr = await open('stderr.log', 'a')

	async function writeQueue(err) {
		let stream = err ? stderr : stdout
		let queue = err ? stderrQueue : stdoutQueue

		while(queue.length > 0) {
			let str = queue[0] + '\n'

			try {
				await write(stream, str)
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
	queue()
}

async function init() {
	function dataToStr(data) {
		if(data.length > 0) {
			let first = data[0]
			let str
			if(typeof first == 'string') {
				str = format(...data)
			} else if(first instanceof Error) {
				str = first.stack
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
	function newLog(...data) {
		let str = dataToStr(data)
		stdoutQueue.push(new Date().toISOString()+' | '+str)
		oldLog(...data)
	}

	// New error function
	function newError(...data) {
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

/* Export functions */
module.exports.init = init