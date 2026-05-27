import { useCallback, useEffect, useRef, useState } from 'react'
import type { MicStatus } from '../types'

const TARGET_SAMPLE_RATE = 16000
const CHUNK_SAMPLES = 1280

function floatTo16BitPcm(input: Float32Array) {
  const pcm = new Int16Array(input.length)
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]))
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }
  return pcm.buffer
}

function resampleTo16k(input: Float32Array, inputRate: number) {
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

type Options = {
  enabled: boolean
  muted: boolean
  onChunk: (chunk: ArrayBuffer) => void
}

export function useMicCapture({ enabled, muted, onChunk }: Options) {
  const [status, setStatus] = useState<MicStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const onChunkRef = useRef(onChunk)
  const mutedRef = useRef(muted)
  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const pcmBufferRef = useRef<number[]>([])
  const teardownRef = useRef<(() => void) | null>(null)

  onChunkRef.current = onChunk
  mutedRef.current = muted

  const pushPcmSamples = useCallback((samples: Float32Array) => {
    if (mutedRef.current) return

    for (let i = 0; i < samples.length; i++) {
      pcmBufferRef.current.push(samples[i])
    }

    while (pcmBufferRef.current.length >= CHUNK_SAMPLES) {
      const chunk = pcmBufferRef.current.splice(0, CHUNK_SAMPLES)
      onChunkRef.current(floatTo16BitPcm(new Float32Array(chunk)))
    }
  }, [])

  const stopCapture = useCallback(() => {
    teardownRef.current?.()
    teardownRef.current = null

    void audioContextRef.current?.close()
    audioContextRef.current = null

    mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
    mediaStreamRef.current = null
    pcmBufferRef.current = []
    setStream(null)
    setStatus('idle')
  }, [])

  const startCapture = useCallback(async () => {
    setError(null)

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      })

      mediaStreamRef.current = mediaStream
      setStream(mediaStream)

      const audioContext = new AudioContext()
      audioContextRef.current = audioContext
      const source = audioContext.createMediaStreamSource(mediaStream)

      let teardown: (() => void) | null = null

      try {
        await audioContext.audioWorklet.addModule('/pcm-processor.worklet.js')
        const worklet = new AudioWorkletNode(audioContext, 'pcm-processor')
        worklet.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
          if (mutedRef.current || !event.data?.byteLength) return
          onChunkRef.current(event.data)
        }
        source.connect(worklet)
        teardown = () => worklet.disconnect()
      } catch {
        const processor = audioContext.createScriptProcessor(4096, 1, 1)
        processor.onaudioprocess = (event) => {
          const input = event.inputBuffer.getChannelData(0)
          pushPcmSamples(resampleTo16k(input, audioContext.sampleRate))
        }
        source.connect(processor)
        processor.connect(audioContext.destination)
        teardown = () => {
          processor.disconnect()
          source.disconnect()
        }
      }

      teardownRef.current = teardown

      if (audioContext.state === 'suspended') {
        await audioContext.resume()
      }

      setStatus(mutedRef.current ? 'muted' : 'recording')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Microphone access denied')
      stopCapture()
    }
  }, [pushPcmSamples, stopCapture])

  useEffect(() => {
    if (!enabled) {
      stopCapture()
      return
    }

    let cancelled = false
    void startCapture().then(() => {
      if (cancelled) stopCapture()
    })

    return () => {
      cancelled = true
      stopCapture()
    }
  }, [enabled, startCapture, stopCapture])

  useEffect(() => {
    const mediaStream = mediaStreamRef.current
    if (!mediaStream) return

    for (const track of mediaStream.getAudioTracks()) {
      track.enabled = !muted
    }

    if (status !== 'idle') {
      setStatus(muted ? 'muted' : 'recording')
    }
  }, [muted, status])

  return {
    status,
    error,
    stream,
    stopCapture,
  }
}
