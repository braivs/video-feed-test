import type { CSSProperties } from 'react'
import type { FeedItem } from '../types/feed'
import styles from './FeedSlide.module.css'
import { VideoPlayer } from './VideoPlayer'

type FeedSlideProps = {
  item: FeedItem
  index: number
  isActive: boolean
  total: number
}

export function FeedSlide({ item, index, isActive, total }: FeedSlideProps) {
  // Each item provides its own colors through CSS custom properties.
  const slideStyle = {
    '--slide-background': item.background,
    '--slide-accent': item.accent,
  } as CSSProperties

  return (
    <article
      aria-label={`Video ${index + 1} of ${total}`}
      className={styles.slide}
      style={slideStyle}
    >
      {/* Rendering only the active iframe stops the previous cross-origin embed. */}
      {isActive && <VideoPlayer embedId={item.embedId} title={item.caption} />}
      <div className={styles.grain} />

      <div className={styles.meta}>
        <p className={styles.author}>{item.author}</p>
        <p className={styles.caption}>{item.caption}</p>
      </div>

      <aside className={styles.actions} aria-label="Video actions">
        <button type="button" aria-label="Like video">
          ♡
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
