import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { MicStatus } from '../../types'

/* ------------------------------------------------------------------ */
/*  State                                                              */
/* ------------------------------------------------------------------ */

export interface MediaState {
  /** Current microphone capture status */
  micStatus: MicStatus
  /** Whether the local mic is muted (still capturing, but not sending) */
  muted: boolean
  /** Human-readable mic error */
  micError: string | null
}

const initialState: MediaState = {
  micStatus: 'idle',
  muted: false,
  micError: null,
}

/* ------------------------------------------------------------------ */
/*  Slice                                                              */
/* ------------------------------------------------------------------ */

const mediaSlice = createSlice({
  name: 'media',
  initialState,
  reducers: {
    setMicStatus(state, action: PayloadAction<MicStatus>) {
      state.micStatus = action.payload
    },
    toggleMute(state) {
      state.muted = !state.muted
    },
    setMuted(state, action: PayloadAction<boolean>) {
      state.muted = action.payload
    },
    setMicError(state, action: PayloadAction<string | null>) {
      state.micError = action.payload
    },
    resetMedia(state) {
      state.micStatus = 'idle'
      state.muted = false
      state.micError = null
    },
  },
})

export const mediaActions = mediaSlice.actions
export const mediaReducer = mediaSlice.reducer
