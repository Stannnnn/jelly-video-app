import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useJellyfinContext } from '../context/JellyfinContext/JellyfinContext'
import { usePlaybackContext } from '../context/PlaybackContext/PlaybackContext'
import { VideoPlayer } from '../VideoPlayer'

export const VideoPlayerPage = () => {
    const { id } = useParams<{ id: string }>()
    const api = useJellyfinContext()
    const playback = usePlaybackContext()
    const playbackRef = useRef(playback)

    const {
        data: item,
        isLoading,
        error,
    } = useQuery({
        queryKey: ['item', id],
        queryFn: () => api.getItemById(id!),
        enabled: !!id,
    })

    useEffect(() => {
        playbackRef.current = playback
    }, [playback])

    useEffect(() => {
        if (item) {
            playbackRef.current.playTrack(item)
        }
    }, [item])

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

    if (error || !item) {
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    color: 'white',
                    fontSize: '1.5rem',
                }}
            >
                Error loading video
            </div>
        )
    }

    return <VideoPlayer />
}
