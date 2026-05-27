import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { TranscriptLine } from '../../types'

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const MAX_LINES = 40

function makeLine(text: string, isFinal: boolean): TranscriptLine {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text,
    isFinal,
    timestamp: Date.now(),
  }
}

function upsert(lines: TranscriptLine[], text: string, isFinal: boolean): TranscriptLine[] {
  if (!text.trim()) return lines

  const last = lines[lines.length - 1]

  // Update the last interim line in-place
  if (last && !last.isFinal) {
    const next = [...lines]
    next[next.length - 1] = { ...last, text, isFinal }
    return next
  }

  // Deduplicate: skip if text is identical to last final line
  if (last && last.isFinal && last.text === text) return lines

  return [...lines, makeLine(text, isFinal)].slice(-MAX_LINES)
}

/* ------------------------------------------------------------------ */
/*  State                                                              */
/* ------------------------------------------------------------------ */

export interface TranscriptState {
  /** Lines of the local user's own speech transcript */
  selfLines: TranscriptLine[]
  /** Lines of the partner's translated speech */
  partnerLines: TranscriptLine[]
}

const initialState: TranscriptState = {
  selfLines: [],
  partnerLines: [],
}

/* ------------------------------------------------------------------ */
/*  Slice                                                              */
/* ------------------------------------------------------------------ */

const transcriptSlice = createSlice({
  name: 'transcript',
  initialState,
  reducers: {
    upsertSelfLine(state, action: PayloadAction<{ text: string; isFinal: boolean }>) {
      state.selfLines = upsert(state.selfLines, action.payload.text, action.payload.isFinal)
    },
    upsertPartnerLine(state, action: PayloadAction<{ text: string; isFinal: boolean }>) {
      state.partnerLines = upsert(state.partnerLines, action.payload.text, action.payload.isFinal)
    },
    clearTranscripts(state) {
      state.selfLines = []
      state.partnerLines = []
    },
  },
})

export const transcriptActions = transcriptSlice.actions
export const transcriptReducer = transcriptSlice.reducer
