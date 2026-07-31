import type { UIEvent } from 'react'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { setActiveIndex, setMuted, toggleLike } from '../store/feedSlice'
import { FeedSlide } from './FeedSlide'
import styles from './FeedShell.module.css'

export function FeedShell() {
  const dispatch = useAppDispatch()
  const { items, activeIndex, isMuted, likedIds } = useAppSelector((state) => state.feed)

  function handleScrollEnd(event: UIEvent<HTMLElement>) {
    const container = event.currentTarget
    // Slides are full-screen, so the scroll offset gives us the active index.
    const index = Math.round(container.scrollTop / container.clientHeight)

    dispatch(setActiveIndex(index))
  }

  return (
    <main className={styles.feed} aria-label="Short video feed" onScrollEnd={handleScrollEnd}>
      {items.map((item, index) => (
        <FeedSlide
          key={item.id}
          item={item}
          index={index}
          isActive={index === activeIndex}
          isLiked={likedIds.includes(item.id)}
          isMuted={isMuted}
          onToggleLike={() => dispatch(toggleLike(item.id))}
          onToggleMuted={() => dispatch(setMuted(!isMuted))}
          total={items.length}
        />
      ))}
    </main>
  )
}
