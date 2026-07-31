import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { mockFeed } from '../api/mockFeed'
import type { FeedItem } from '../types/feed'

type FeedState = {
  items: FeedItem[]
  activeIndex: number
  isMuted: boolean
  likedIds: string[]
}

const initialState: FeedState = {
  items: mockFeed,
  activeIndex: 0,
  isMuted: true,
  likedIds: [],
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
    toggleLike(state, action: PayloadAction<string>) {
      const item = state.items.find((feedItem) => feedItem.id === action.payload)
      if (!item) return

      const likedIndex = state.likedIds.indexOf(item.id)
      if (likedIndex >= 0) {
        // Keep the selected IDs and the visible counter in sync.
        state.likedIds.splice(likedIndex, 1)
        item.likes = Math.max(0, item.likes - 1)
      } else {
        state.likedIds.push(item.id)
        item.likes += 1
      }
    },
  },
})

export const { setActiveIndex, setMuted, toggleLike } = feedSlice.actions
export default feedSlice.reducer
