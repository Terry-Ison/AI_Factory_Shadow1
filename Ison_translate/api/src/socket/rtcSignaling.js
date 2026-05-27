/**
 * Relay WebRTC signaling messages between peers in the same session.
 * @param {import('socket.io').Server} io
 * @param {import('../rooms/sessionManager.js').Session} session
 * @param {string} fromSocketId
 * @param {{ type: string, sdp?: unknown, candidate?: unknown }} signal
 */
export function relayRtcSignal(io, session, fromSocketId, signal) {
  for (const client of session.clients.values()) {
    if (client.socketId === fromSocketId) continue
    io.to(client.socketId).emit('webrtc_signal', {
      from: fromSocketId,
      ...signal,
    })
  }
}
