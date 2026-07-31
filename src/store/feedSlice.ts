import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { mockFeed } from '../api/mockFeed'
import type { FeedItem } from '../types/feed'

type FeedState = {
  items: FeedItem[]
  activeIndex: number
  isMuted: boolean
}

const initialState: FeedState = {
  items: mockFeed,
  activeIndex: 0,
  isMuted: true,
}

const feedSlice = createSlice({
  name: 'feed',
  initialState,
  reducers: {
    setActiveIndex(state, action: PayloadAction<number>) {
      state.activeIndex = action.payload
    },
    setMuted(state, action: PayloadAction<boolean>) {
      state.isMuted = action.payload
    },
  },
})

export const { setActiveIndex, setMuted } = feedSlice.actions
export default feedSlice.reducer
