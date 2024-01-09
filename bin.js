import fs from 'fs'

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
  config = yaml.load(fs.readFileSync(process.argv(1), 'utf8'))
} catch (e) {
  throw e
}

import { connect } from 'mqtt'
const client = connect(config.mqtt)
