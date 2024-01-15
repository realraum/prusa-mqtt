#!/usr/bin/env node

import fs from 'fs'
import { connect } from 'mqtt'
import yaml from 'js-yaml'
import debug from 'debug'

const log = debug('prusa-mqtt')

const nullbyte = Buffer.allocUnsafe(0)

function PrusaPrinter(host, apiKey) {
	async function req(url, method = 'GET', headers = {}) {
		const req = await fetch(host + '/api' + url, {
			method,
			headers: {
				'X-Api-Key': apiKey,
				...headers,
			}
		})

		const json = await req.json()

		return json
	}

	const self = {
		async info() {
			const job = await req('/job')
			return job
		}
	}

	return self
}

console.log('Starting...')

let config

try {
	config = yaml.load(fs.readFileSync(process.argv.pop(), 'utf8'))
} catch (e) {
	throw e
}

const client = connect(config.mqtt)

function Daemon(client, { display, ip, key, topic }) {
	const printer = PrusaPrinter("http://" + ip, key)

	let lock

	async function clear() {
		log('@%s: Clearing', display)
		await client.publishAsync(topic, nullbyte, {
			retain: true
		})
	}

	let queued = false

	async function wrapper() {
		if (queued) return
		try {
			queued = true
			await lock
		} catch (e) {
			// noop
		}
		queued = false
		if (!intv) return
		lock = main()
	}

	async function main() {
		let info

		try {
			info = await printer.info()
		} catch (e) {
			log('@%s: Failed to fetch info: %o', display, String(e))
			await clear()
			return
		}

		if (info.state === 'Printing' || info.state === 'Finished') {
			log('@%s: Publishing job %s', display, info.job.file.display)
			await client.publishAsync(topic, JSON.stringify({
				Printer: display,
				Job: info.job.file.display,
				Elapsed_time_s: info.progress.printTime,
				Progress_percent: Math.floor(info.progress.completion * 100)
			}))
		} else {
			await clear()
		}
	}

	let intv

	return {
		start() {
			log('@%s: Starting', display)
			if (!intv) intv = setInterval(wrapper, 1000)
		},
		async stop() {
                        log('@%s: Stopping', display)
			clearInterval(intv)
			await lock
			await clear()
			intv = null
                        log('@%s: Stopped', display)
		}
	}
}

let daemons = []

for (const printer of config.printers) {
	daemons.push(Daemon(client, printer))
}

for (const daemon of daemons) {
	daemon.start()
}

console.log('Started!')

async function stop() {
	console.log('Stopping...')

	for (const daemon of daemons) {
		await daemon.stop()
	}

	await client.endAsync()

	console.log('Stopped!')
}

process.on('SIGINT', stop)
process.on('SIGTERM', stop)
