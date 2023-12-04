/**
 * Polyfill for fetch.
 *
 * Uses native Node.js fetch if available, otherwise uses the `node-fetch` package.
 *
 * @module
 */

type Fetch = (input: RequestInfo | URL, init?: RequestInit | undefined) => Promise<Response>

let fetchImpl: Fetch
if (typeof fetch === 'undefined') {
    fetchImpl = require('node-fetch')
} else {
    fetchImpl = fetch
}

export default fetchImpl
