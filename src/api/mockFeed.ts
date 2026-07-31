import type { FeedItem } from '../types/feed'

// Temporary feed data. It will be replaced by an API response later.
export const mockFeed: FeedItem[] = [
  {
    id: 'nc78',
    author: '@namazon.club',
    caption: 'Sima vs Cherviak — Fight 4',
    likes: 12_804,
    accent: '#ffb86b',
    background: 'linear-gradient(160deg, #201046 0%, #6d2f94 48%, #ff785b 100%)',
    videoUrl: 'https://media.namazon.club/NC78_Sima_vs_Cherviak_fight_4_preview.mp4',
  },
  {
    id: 'nc79',
    author: '@namazon.club',
    caption: 'Sima vs Cherviak — Fight 5',
    likes: 8_125,
    accent: '#9af7e8',
    background: 'linear-gradient(160deg, #013d55 0%, #008f9c 48%, #63d7b4 100%)',
    videoUrl: 'https://media.namazon.club/NC79_Sima_vs_Cherviak_fight_5_preview.mp4',
  },
  {
    id: 'nc80',
    author: '@namazon.club',
    caption: 'Sima vs Alex — Fight 6',
    likes: 27_901,
    accent: '#ffe4b5',
    background: 'linear-gradient(160deg, #27180f 0%, #79452b 52%, #d99a58 100%)',
    videoUrl: 'https://media.namazon.club/NC80_Sima_vs_Alex_fight_6_preview.mp4',
  },
  {
    id: 'nc81',
    author: '@namazon.club',
    caption: 'Amrita vs Alex — Fight 2',
    likes: 4_763,
    accent: '#d4e9ff',
    background: 'linear-gradient(160deg, #14233e 0%, #285580 47%, #8ab6d9 100%)',
    videoUrl: 'https://media.namazon.club/NC81_Amrita_vs_Alex_fight_2_preview.mp4',
  },
  {
    id: 'nc82',
    author: '@namazon.club',
    caption: 'Sveta vs Alex — Fight 2',
    likes: 16_390,
    accent: '#ffd6fa',
    background: 'linear-gradient(160deg, #260737 0%, #6e1d78 50%, #da5f9f 100%)',
    videoUrl: 'https://media.namazon.club/NC82_Sveta_vs_Alex_fight_2_preview.mp4',
  },
]
