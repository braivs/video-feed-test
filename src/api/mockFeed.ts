import type { FeedItem } from '../types/feed'

// Temporary feed data. It will be replaced by an API response later.
export const mockFeed: FeedItem[] = [
  {
    id: 'city-lights',
    author: '@alina.travels',
    caption: 'The city never sleeps ✨',
    likes: 12_804,
    accent: '#ffb86b',
    background: 'linear-gradient(160deg, #201046 0%, #6d2f94 48%, #ff785b 100%)',
  },
  {
    id: 'summer-splash',
    author: '@max.sun',
    caption: 'Summer in one frame',
    likes: 8_125,
    accent: '#9af7e8',
    background: 'linear-gradient(160deg, #013d55 0%, #008f9c 48%, #63d7b4 100%)',
  },
  {
    id: 'coffee-notes',
    author: '@maria.cooks',
    caption: 'The perfect slow morning ☕',
    likes: 27_901,
    accent: '#ffe4b5',
    background: 'linear-gradient(160deg, #27180f 0%, #79452b 52%, #d99a58 100%)',
  },
  {
    id: 'mountain-road',
    author: '@ivan.outside',
    caption: 'The road above the clouds',
    likes: 4_763,
    accent: '#d4e9ff',
    background: 'linear-gradient(160deg, #14233e 0%, #285580 47%, #8ab6d9 100%)',
  },
  {
    id: 'violet-night',
    author: '@sonya.music',
    caption: 'A playlist for an evening walk',
    likes: 16_390,
    accent: '#ffd6fa',
    background: 'linear-gradient(160deg, #260737 0%, #6e1d78 50%, #da5f9f 100%)',
  },
]
