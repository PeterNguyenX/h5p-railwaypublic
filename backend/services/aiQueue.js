/**
 * In-memory AI job queue.
 * Two queues: groqQueue (up to 3 concurrent) and ollamaQueue (1 at a time).
 * Emits position update events so route handlers can forward them over SSE.
 */

const { EventEmitter } = require('events');
const crypto = require('crypto');

class JobQueue extends EventEmitter {
  constructor(maxConcurrent = 1, name = 'queue') {
    super();
    this.setMaxListeners(500); // support 100+ waiting SSE connections
    this.maxConcurrent = maxConcurrent;
    this.name = name;
    this.active = 0;
    this.pending = []; // { jobId, fn, resolve, reject }
  }

  get size() { return this.pending.length; }
  get totalWaiting() { return this.pending.length + this.active; }

  /**
   * Add a job. Returns { jobId, position, promise }.
   * position = 1 means "runs immediately if a slot is free".
   */
  enqueue(fn) {
    const jobId = crypto.randomUUID();
    let resolve, reject;
    const promise = new Promise((res, rej) => { resolve = res; reject = rej; });

    this.pending.push({ jobId, fn, resolve, reject });
    const position = this.pending.length + this.active; // position in overall load

    this._broadcastPositions();
    this._tick();

    return { jobId, position, promise };
  }

  /** Notify each waiting job of its current queue position. */
  _broadcastPositions() {
    this.pending.forEach((job, idx) => {
      this.emit(`pos:${job.jobId}`, idx + 1);
    });
  }

  _tick() {
    while (this.active < this.maxConcurrent && this.pending.length > 0) {
      const job = this.pending.shift();
      this.active++;
      this._broadcastPositions();

      Promise.resolve()
        .then(() => job.fn())
        .then(r => job.resolve(r))
        .catch(e => job.reject(e))
        .finally(() => {
          this.active--;
          this._tick();
        });
    }
  }
}

const groqQueue  = new JobQueue(2, 'groq');   // Groq free tier: 2 concurrent (12k TPM limit)
const ollamaQueue = new JobQueue(1, 'ollama'); // local Ollama: strictly serial (single GPU/CPU)

module.exports = { groqQueue, ollamaQueue };
