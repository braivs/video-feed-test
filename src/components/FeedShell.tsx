import type { UIEvent } from 'react'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { setActiveIndex } from '../store/feedSlice'
import { FeedSlide } from './FeedSlide'
import styles from './FeedShell.module.css'

export function FeedShell() {
  const dispatch = useAppDispatch()
  const { items, activeIndex } = useAppSelector((state) => state.feed)

  function handleScrollEnd(event: UIEvent<HTMLElement>) {
    const container = event.currentTarget
    // Every slide has viewport height, so scrollTop maps directly to its index.
    const index = Math.round(container.scrollTop / container.clientHeight)

    dispatch(setActiveIndex(index))
  }

  return (
    <main className={styles.feed} aria-label="Short video feed" onScrollEnd={handleScrollEnd}>
      <output className={styles.activeIndicator} aria-live="polite">
        Active: {activeIndex + 1} / {items.length}
      </output>

      {/* One FeedSlide is rendered for every feed item. */}
      {items.map((item, index) => (
        <FeedSlide
          key={item.id}
          item={item}
          index={index}
          isActive={index === activeIndex}
          total={items.length}
        />
      ))}
    </main>
  )
}
