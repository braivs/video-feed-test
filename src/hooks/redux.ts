import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '../store'

// Typed Redux hooks keep component code concise and type-safe.
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
