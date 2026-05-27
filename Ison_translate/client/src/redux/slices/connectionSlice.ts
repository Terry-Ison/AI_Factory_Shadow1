import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { WebRtcSignalMessage } from '../../types'

/* ------------------------------------------------------------------ */
/*  State                                                              */
/* ------------------------------------------------------------------ */

export interface ConnectionState {
  /** Whether the WebSocket transport is connected */
  socketConnected: boolean
  /** Whether a partner is present in the session */
  partnerConnected: boolean
  /** Latest inbound WebRTC signaling message to be consumed by useWebRTC */
  rtcSignal: WebRtcSignalMessage | null
}

const initialState: ConnectionState = {
  socketConnected: false,
  partnerConnected: false,
  rtcSignal: null,
}

/* ------------------------------------------------------------------ */
/*  Slice                                                              */
/* ------------------------------------------------------------------ */

const connectionSlice = createSlice({
  name: 'connection',
  initialState,
  reducers: {
    setSocketConnected(state, action: PayloadAction<boolean>) {
      state.socketConnected = action.payload
    },
    setPartnerConnected(state, action: PayloadAction<boolean>) {
      state.partnerConnected = action.payload
    },
    setRtcSignal(state, action: PayloadAction<WebRtcSignalMessage | null>) {
      state.rtcSignal = action.payload
    },
    resetConnection(state) {
      state.socketConnected = false
      state.partnerConnected = false
      state.rtcSignal = null
    },
  },
})

export const connectionActions = connectionSlice.actions
export const connectionReducer = connectionSlice.reducer
