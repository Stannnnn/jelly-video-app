import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Loader } from '../components/Loader'
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

    if (isLoading) {
        return <Loader />
    }

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
