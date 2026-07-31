import { mockFeed } from '../api/mockFeed'
import { FeedSlide } from './FeedSlide'
import styles from './FeedShell.module.css'

export function FeedShell() {
  return (
    <main className={styles.feed} aria-label="Short video feed">
      {/* One FeedSlide is rendered for every feed item. */}
      {mockFeed.map((item, index) => (
        <FeedSlide key={item.id} item={item} index={index} total={mockFeed.length} />
      ))}
    </main>
  )
}
