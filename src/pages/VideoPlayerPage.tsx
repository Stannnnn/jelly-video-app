import { useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { usePlaybackContext } from '../context/PlaybackContext/PlaybackContext'
import { useJellyfinMediaItem } from '../hooks/Jellyfin/useJellyfinMediaItem'
import { VideoPlayer } from '../VideoPlayer'

export const VideoPlayerPage = () => {
    const { id, mediaSourceIndex } = useParams<{ id: string; mediaSourceIndex?: string }>()
    const playback = usePlaybackContext()
    const playbackRef = useRef(playback)

    const { mediaItem: item, isLoading, error } = useJellyfinMediaItem(id)

    useEffect(() => {
        playbackRef.current = playback
    }, [playback])

    useEffect(() => {
        if (item) {
            playbackRef.current.playTrack(item, Number(mediaSourceIndex))
        }
    }, [item, mediaSourceIndex])

    useEffect(() => {
        return () => {
            playbackRef.current.clearCurrentTrack()
        }
    }, [])

    // Keyboard controls
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (!playback.isInitialized) return

            switch (e.key) {
                case ' ':
                    e.preventDefault()
                    playback.togglePlayPause()
                    break
                case 'k':
                case 'K':
                    e.preventDefault()
                    playback.togglePlayPause()
                    break
                case 'j':
                case 'J':
                    e.preventDefault()
                    playback.skip(-10)
                    break
                case 'l':
                case 'L':
                    e.preventDefault()
                    playback.skip(10)
                    break
                case 'f':
                case 'F':
                    playback.toggleFullscreen()
                    break
                case 'ArrowLeft':
                    playback.skip(-5)
                    break
                case 'ArrowRight':
                    playback.skip(5)
                    break
                case 'ArrowUp':
                    e.preventDefault()
                    if (playback.volume < 100) {
                        playback.handleVolumeChange(Math.min(100, playback.volume + 5))
                    }
                    break
                case 'ArrowDown':
                    e.preventDefault()
                    if (playback.volume > 0) {
                        playback.handleVolumeChange(Math.max(0, playback.volume - 5))
                    }
                    break
                case 'm':
                case 'M':
                    playback.toggleMute()
                    break
            }
        }

        window.addEventListener('keydown', handleKeyPress)
        return () => window.removeEventListener('keydown', handleKeyPress)
    }, [playback])

    return <VideoPlayer isLoading={isLoading} error={error} />
}
