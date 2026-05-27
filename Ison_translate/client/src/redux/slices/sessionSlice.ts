import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { SessionConfig } from '../../types'

/* ------------------------------------------------------------------ */
/*  State                                                              */
/* ------------------------------------------------------------------ */

export interface SessionState {
  /** Form field: session ID typed by the user */
  sessionIdInput: string
  /** Selected source language code */
  sourceLang: string
  /** Selected target language code */
  targetLang: string
  /** Auto-generated user id for this browser tab */
  userId: string
  /** Active session config — null when not joined */
  config: SessionConfig | null
  /** True while the join request is in-flight */
  joining: boolean
  /** Error message from a failed join attempt */
  joinError: string | null
}

const initialState: SessionState = {
  sessionIdInput: '',
  sourceLang: 'en',
  targetLang: 'hi',
  userId: `user-${Math.random().toString(36).slice(2, 9)}`,
  config: null,
  joining: false,
  joinError: null,
}

/* ------------------------------------------------------------------ */
/*  Slice                                                              */
/* ------------------------------------------------------------------ */

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setSessionIdInput(state, action: PayloadAction<string>) {
      state.sessionIdInput = action.payload
    },
    setSourceLang(state, action: PayloadAction<string>) {
      state.sourceLang = action.payload
    },
    setTargetLang(state, action: PayloadAction<string>) {
      state.targetLang = action.payload
    },
    setJoining(state, action: PayloadAction<boolean>) {
      state.joining = action.payload
    },
    setJoinError(state, action: PayloadAction<string | null>) {
      state.joinError = action.payload
    },
    joinedSession(state, action: PayloadAction<SessionConfig>) {
      state.config = action.payload
      state.joining = false
      state.joinError = null
    },
    leftSession(state) {
      state.config = null
      state.joining = false
      state.joinError = null
    },
  },
})

export const sessionActions = sessionSlice.actions
export const sessionReducer = sessionSlice.reducer
