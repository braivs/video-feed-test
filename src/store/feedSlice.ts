import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { mockFeed } from '../api/mockFeed'
import type { FeedItem } from '../types/feed'

type FeedState = {
  items: FeedItem[]
  activeIndex: number
}

const initialState: FeedState = {
  items: mockFeed,
  activeIndex: 0,
}

const feedSlice = createSlice({
  name: 'feed',
  initialState,
  reducers: {
    setActiveIndex(state, action: PayloadAction<number>) {
      state.activeIndex = action.payload
    },
  },
})

export const { setActiveIndex } = feedSlice.actions
export default feedSlice.reducer
