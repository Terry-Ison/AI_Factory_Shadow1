import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

/* ------------------------------------------------------------------ */
/*  State                                                              */
/* ------------------------------------------------------------------ */

export interface UiState {
  /** Informational hint shown to the user (e.g. "waiting for partner") */
  statusHint: string | null
  /** Server-side error surfaced to the UI */
  serverError: string | null
}

const initialState: UiState = {
  statusHint: null,
  serverError: null,
}

/* ------------------------------------------------------------------ */
/*  Slice                                                              */
/* ------------------------------------------------------------------ */

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setStatusHint(state, action: PayloadAction<string | null>) {
      state.statusHint = action.payload
    },
    setServerError(state, action: PayloadAction<string | null>) {
      state.serverError = action.payload
    },
    clearAlerts(state) {
      state.statusHint = null
      state.serverError = null
    },
  },
})

export const uiActions = uiSlice.actions
export const uiReducer = uiSlice.reducer
