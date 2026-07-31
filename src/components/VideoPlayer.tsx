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
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (isActive) {
      // A paused native video retains currentTime, so playback resumes on return.
      video.play().catch(() => {
        // Muted autoplay can still be blocked by a browser or user setting.
      })
    } else {
      video.pause()
    }
  }, [isActive])

  function togglePlayback() {
    const video = videoRef.current
    if (!video || !isActive) return

    if (video.paused) {
      video.play().catch(() => {
        // Muted autoplay can still be blocked by a browser or user setting.
      })
    } else {
      video.pause()
    }
  }

  function updateProgress() {
    const video = videoRef.current
    if (!video || !Number.isFinite(video.duration) || video.duration === 0) return

    setProgress(video.currentTime / video.duration)
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
        onPause={() => setIsPaused(true)}
        onPlay={() => setIsPaused(false)}
        onTimeUpdate={updateProgress}
      />

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
