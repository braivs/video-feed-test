import styles from './VideoPlayer.module.css'

type VideoPlayerProps = {
  embedId: string
  title: string
}

export function VideoPlayer({ embedId, title }: VideoPlayerProps) {
  // The host decides whether these standard embed parameters are supported.
  const source = `https://mixedwrestling.video/embed/${embedId}?autoplay=1&muted=1`

  return (
    <iframe
      allow="autoplay; fullscreen; picture-in-picture"
      className={styles.player}
      src={source}
      title={title}
    />
  )
}
