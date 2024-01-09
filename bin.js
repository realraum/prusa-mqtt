#!/usr/bin/env node

import fs from 'fs'
import { connect } from 'mqtt'
import yaml from 'js-yaml'

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

	async function wrapper() {
		try {
			await lock
		} catch (e) {
			// noop
		}
		if (!intv) return
		lock = main()
	}

	async function main() {
		let info

		try {
			info = await printer.info()
		} catch (e) {
			console.error('Failed to fetch info for %s: %o', display, String(e))
			await client.publishAsync(topic, Buffer.from([]))
			return
		}

		if (info.state === 'Printing' || info.state === 'Finished') {
			await client.publishAsync(topic, JSON.stringify({
				Printer: display,
				Job: info.job.file.display,
				Elapsed_time_s: info.progress.printTime,
				Progress_percent: Math.floor(info.progress.completion * 100)
			}))
		} else {
			await client.publishAsync(topic, Buffer.from([]))
		}
	}

	let intv

	return {
		start() {
			if (!intv) intv = setInterval(wrapper, 1000)
		},
		async stop() {
			clearInterval(intv)
			await lock
			await client.publishAsync(topic, Buffer.from([]))
			intv = null
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
