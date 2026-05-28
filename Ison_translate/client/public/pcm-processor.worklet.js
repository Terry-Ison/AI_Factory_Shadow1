const TARGET_SAMPLE_RATE = 16000
// DeepL Voice: send 50–250ms chunks; ~100ms balances latency vs rate limits
const CHUNK_SAMPLES = 1600

function resampleTo16k(input, inputRate) {
  if (inputRate === TARGET_SAMPLE_RATE) return input

  const ratio = inputRate / TARGET_SAMPLE_RATE
  const outputLength = Math.floor(input.length / ratio)
  const output = new Float32Array(outputLength)

  for (let i = 0; i < outputLength; i++) {
    const srcIdx = i * ratio
    const idx = Math.floor(srcIdx)
    const frac = srcIdx - idx
    const s0 = input[idx] ?? 0
    const s1 = input[idx + 1] ?? s0
    output[i] = s0 + frac * (s1 - s0)
  }

  return output
}

class PcmProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this._buffer = []
  }

  process(inputs) {
    const input = inputs[0]
    if (!input || !input[0]) return true

    const resampled = resampleTo16k(input[0], sampleRate)
    for (let i = 0; i < resampled.length; i++) {
      this._buffer.push(resampled[i])
    }

    while (this._buffer.length >= CHUNK_SAMPLES) {
      const chunk = this._buffer.splice(0, CHUNK_SAMPLES)
      const pcm = new Int16Array(chunk.length)
      for (let i = 0; i < chunk.length; i++) {
        const s = Math.max(-1, Math.min(1, chunk[i]))
        pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff
      }
      this.port.postMessage(pcm.buffer, [pcm.buffer])
    }

    return true
  }
}

registerProcessor('pcm-processor', PcmProcessor)
