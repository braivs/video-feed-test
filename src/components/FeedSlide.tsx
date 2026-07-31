import type { CSSProperties } from 'react'
import type { FeedItem } from '../types/feed'
import styles from './FeedSlide.module.css'
import { VideoPlayer } from './VideoPlayer'

type FeedSlideProps = {
  item: FeedItem
  index: number
  isActive: boolean
  isLiked: boolean
  isMuted: boolean
  onToggleLike: () => void
  onToggleMuted: () => void
  total: number
}

export function FeedSlide({
  item,
  index,
  isActive,
  isLiked,
  isMuted,
  onToggleLike,
  onToggleMuted,
  total,
}: FeedSlideProps) {
  // Pass the accent as a CSS variable so one shared style can render every card.
  const slideStyle = {
    '--slide-accent': item.accent,
  } as CSSProperties

  return (
    <article
      aria-label={`Video ${index + 1} of ${total}`}
      className={styles.slide}
      style={slideStyle}
    >
      {/* Keep videos mounted so they resume where the user left off. */}
      <VideoPlayer
        isActive={isActive}
        isMuted={isMuted}
        onToggleMuted={onToggleMuted}
        title={item.caption}
        videoUrl={item.videoUrl}
      />
      <div className={styles.grain} />

      <div className={styles.meta}>
        <p className={styles.author}>{item.author}</p>
        <p className={styles.caption}>{item.caption}</p>
      </div>

      <aside className={styles.actions} aria-label="Video actions">
        <button
          className={isLiked ? styles.liked : undefined}
          type="button"
          aria-label={isLiked ? 'Remove like' : 'Like video'}
          aria-pressed={isLiked}
          onClick={onToggleLike}
        >
          {isLiked ? '♥' : '♡'}
          <span>{item.likes.toLocaleString('ru-RU')}</span>
        </button>
        <button type="button" aria-label="Open comments">
          ◌
          <span>Comments</span>
        </button>
        <button type="button" aria-label="Share video">
          ↗
          <span>Share</span>
        </button>
      </aside>

      <span className={styles.counter}>
        {index + 1} / {total}
      </span>
    </article>
  )
}
