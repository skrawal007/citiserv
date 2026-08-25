'use strict';

/**
 * sseBroadcast.js
 * ───────────────
 * Singleton in-memory registry of all active SSE (Server-Sent Events) clients.
 * Node.js is single-threaded, so a plain Set is perfectly safe here.
 *
 * Usage (server side):
 *   const sse = require('./sseBroadcast');
 *   sse.broadcast('queue:added', { request_number: '123', status: 'PENDING' });
 */

const clients = new Set();

/**
 * Register a new SSE response object.
 * @param {import('express').Response} res
 */
function addClient(res) {
  clients.add(res);
  console.log(`[SSE] Client connected. Total: ${clients.size}`);
}

/**
 * Remove a disconnected SSE response object.
 * @param {import('express').Response} res
 */
function removeClient(res) {
  clients.delete(res);
  console.log(`[SSE] Client disconnected. Total: ${clients.size}`);
}

/**
 * Broadcast a named SSE event to every connected client.
 * Dead connections are silently removed.
 *
 * @param {string} eventName  e.g. 'queue:added' | 'queue:processing' | 'queue:completed' | 'queue:failed'
 * @param {object} data       JSON-serialisable payload
 */
function broadcast(eventName, data) {
  const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  let removed = 0;
  for (const client of clients) {
    try {
      client.write(payload);
    } catch (_err) {
      // Stream is dead — clean up
      clients.delete(client);
      removed++;
    }
  }
  if (removed > 0) {
    console.log(`[SSE] Cleaned up ${removed} dead client(s). Total: ${clients.size}`);
  }
}

module.exports = {
  addClient,
  removeClient,
  broadcast,
  get clientCount() { return clients.size; },
};
