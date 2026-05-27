import { useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from './store'

/**
 * Pre-typed dispatch hook — use throughout the app instead of plain `useDispatch`.
 */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()

/**
 * Pre-typed selector hook — use throughout the app instead of plain `useSelector`.
 */
export const useAppSelector = useSelector.withTypes<RootState>()
