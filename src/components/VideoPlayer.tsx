import { useEffect, useRef, useState } from 'react'
import styles from './VideoPlayer.module.css'

type VideoPlayerProps = {
  isActive: boolean
  isMuted: boolean
  onToggleMuted: () => void
  title: string
  videoUrl: string
}

export function VideoPlayer({
  isActive,
  isMuted,
  onToggleMuted,
  title,
  videoUrl,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState(0)

  function playVideo(video: HTMLVideoElement) {
    video.play().catch(() => {
      // Autoplay can still be blocked, so the tap-to-play UI stays available.
    })
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (isActive) {
      // Keep the element mounted so the browser keeps its currentTime.
      playVideo(video)
    } else {
      video.pause()
    }
  }, [isActive])

  function togglePlayback() {
    const video = videoRef.current
    if (!video || !isActive) return

    if (video.paused) {
      playVideo(video)
    } else {
      video.pause()
    }
  }

  function updateProgress() {
    const video = videoRef.current
    if (!video || !Number.isFinite(video.duration) || video.duration === 0) return

    // Keep frequent progress updates local; Redux does not need them.
    setProgress(video.currentTime / video.duration)
  }

  function retryPlayback() {
    const video = videoRef.current
    if (!video) return

    setHasError(false)
    setIsLoading(true)
    // Reload the element after a transient network or media error.
    video.load()
  }

  return (
    <>
      <video
        ref={videoRef}
        className={styles.player}
        crossOrigin="anonymous"
        loop
        muted={isMuted}
        playsInline
        preload={isActive ? 'auto' : 'metadata'}
        src={videoUrl}
        aria-label={title}
        onClick={togglePlayback}
        onCanPlay={(event) => {
          // The active-index effect will not rerun after retry, so resume here.
          setIsLoading(false)
          if (isActive) playVideo(event.currentTarget)
        }}
        onError={() => {
          setHasError(true)
          setIsLoading(false)
        }}
        onLoadStart={() => {
          setHasError(false)
          setIsLoading(true)
        }}
        onPause={() => setIsPaused(true)}
        onPlay={() => setIsPaused(false)}
        onPlaying={() => setIsLoading(false)}
        onTimeUpdate={updateProgress}
      />

      {isActive && isLoading && !hasError && <span className={styles.loader} aria-label="Loading video" />}

      {isActive && hasError && (
        <div className={styles.errorState} role="status">
          <span>Video unavailable</span>
          <button type="button" onClick={retryPlayback}>
            Retry
          </button>
        </div>
      )}

      {isActive && isPaused && (
        <span className={styles.playIndicator} aria-hidden="true">
          ▶
        </span>
      )}

      <button
        className={styles.soundToggle}
        type="button"
        aria-label={isMuted ? 'Turn sound on' : 'Turn sound off'}
        aria-pressed={!isMuted}
        onClick={onToggleMuted}
      >
        {isMuted ? '🔇' : '🔊'}
      </button>

      <div className={styles.progressTrack} aria-hidden="true">
        <div className={styles.progressValue} style={{ transform: `scaleX(${progress})` }} />
      </div>
    </>
  )
}
