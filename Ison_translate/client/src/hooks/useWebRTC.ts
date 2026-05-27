import { useCallback, useEffect, useRef } from 'react'
import type { WebRtcSignalMessage } from '../types'

const ICE_SERVERS: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }]

type Options = {
  enabled: boolean
  isInitiator: boolean
  localStream: MediaStream | null
  onSignal: (signal: Omit<WebRtcSignalMessage, 'from'>) => void
  onRemoteStream: (stream: MediaStream) => void
  onSignalMessage: WebRtcSignalMessage | null
}

export function useWebRTC({
  enabled,
  isInitiator,
  localStream,
  onSignal,
  onRemoteStream,
  onSignalMessage,
}: Options) {
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const makingOfferRef = useRef(false)

  const ensurePeerConnection = useCallback(() => {
    if (pcRef.current) return pcRef.current

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
    pcRef.current = pc

    pc.onicecandidate = (event) => {
      if (!event.candidate) return
      onSignal({
        type: 'ice_candidate',
        candidate: event.candidate.toJSON(),
      })
    }

    pc.ontrack = (event) => {
      const [stream] = event.streams
      if (stream) onRemoteStream(stream)
    }

    if (localStream) {
      for (const track of localStream.getTracks()) {
        pc.addTrack(track, localStream)
      }
    }

    return pc
  }, [localStream, onRemoteStream, onSignal])

  const createOffer = useCallback(async () => {
    const pc = ensurePeerConnection()
    makingOfferRef.current = true
    try {
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      onSignal({ type: 'offer', sdp: offer })
    } finally {
      makingOfferRef.current = false
    }
  }, [ensurePeerConnection, onSignal])

  useEffect(() => {
    if (!enabled || !isInitiator || !localStream) return
    void createOffer()
  }, [enabled, isInitiator, localStream, createOffer])

  useEffect(() => {
    if (!enabled || !onSignalMessage) return

    const handleSignal = async () => {
      const pc = ensurePeerConnection()
      const msg = onSignalMessage

      if (msg.type === 'offer' && msg.sdp) {
        await pc.setRemoteDescription(msg.sdp)
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        onSignal({ type: 'answer', sdp: answer })
      } else if (msg.type === 'answer' && msg.sdp) {
        await pc.setRemoteDescription(msg.sdp)
      } else if (msg.type === 'ice_candidate' && msg.candidate) {
        try {
          await pc.addIceCandidate(msg.candidate)
        } catch {
          // ignore stale candidates
        }
      }
    }

    void handleSignal()
  }, [enabled, ensurePeerConnection, onSignal, onSignalMessage])

  useEffect(() => {
    if (!enabled) return

    return () => {
      pcRef.current?.close()
      pcRef.current = null
    }
  }, [enabled])

  useEffect(() => {
    const pc = pcRef.current
    if (!enabled || !pc || !localStream) return

    const senders = pc.getSenders()
    for (const track of localStream.getTracks()) {
      const alreadyAdded = senders.some((sender) => sender.track?.id === track.id)
      if (!alreadyAdded) {
        pc.addTrack(track, localStream)
      }
    }
  }, [enabled, localStream])

  return { createOffer }
}
