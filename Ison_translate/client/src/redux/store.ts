import { configureStore } from '@reduxjs/toolkit'
import { sessionReducer } from './slices/sessionSlice'
import { transcriptReducer } from "./slices/transcriptSlice"
import { mediaReducer } from './slices/mediaSlice'
import { connectionReducer } from './slices/connectionSlice'
import { uiReducer } from './slices/uiSlice'

export const store = configureStore({
  reducer: {
    session: sessionReducer,
    transcript: transcriptReducer,
    media: mediaReducer,
    connection: connectionReducer,
    ui: uiReducer,
  },
  devTools: import.meta.env.DEV,
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
