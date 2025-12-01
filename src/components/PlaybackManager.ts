import { useCallback, useEffect, useRef, useState } from 'react'
import {
    command,
    destroy,
    init,
    observeProperties,
    setProperty,
    type MpvObservableProperty,
} from 'tauri-plugin-libmpv-api'
import { MediaItem } from '../api/jellyfin'
import { useAudioStorageContext } from '../context/AudioStorageContext/AudioStorageContext'
import { useJellyfinContext } from '../context/JellyfinContext/JellyfinContext'

// NOTES; Do not use `command('set_property')`; use setProperty instead!

// Define observed properties with their types
const OBSERVED_PROPERTIES = [
    ['pause', 'flag'],
    ['time-pos', 'double', 'none'],
    ['duration', 'double', 'none'],
    ['track-list', 'node'],
    ['sid', 'int64'],
    ['volume', 'int64'],
    ['speed', 'double'],
] as const satisfies MpvObservableProperty[]

interface SubtitleTrack {
    id: number
    type: string
    title?: string
    lang?: string
    selected?: boolean
}

export type PlaybackManagerProps = {
    initialVolume: number
    clearOnLogout?: boolean
}

export const usePlaybackManager = ({ initialVolume, clearOnLogout }: PlaybackManagerProps) => {
    const api = useJellyfinContext()
    // Session based play count for settings page
    const [sessionPlayCount, setSessionPlayCount] = useState(() => {
        const saved = localStorage.getItem('sessionPlayCount')
        return saved ? Number(saved) : 0
    })

    // UI Settings
    const [rememberFilters, setRememberFilters] = useState(localStorage.getItem('rememberFilters') === 'on')
    useEffect(() => localStorage.setItem('rememberFilters', rememberFilters ? 'on' : 'off'), [rememberFilters])

    // MPV state
    const [isPaused, setIsPaused] = useState(false)
    const [timePos, setTimePos] = useState(0)
    const [duration, setDuration] = useState(0)
    const [isInitialized, setIsInitialized] = useState(false)
    const [subtitleTracks, setSubtitleTracks] = useState<SubtitleTrack[]>([])
    const [currentSubtitleId, setCurrentSubtitleId] = useState<number | null>(null)
    const [speed, setSpeed] = useState(1.0)
    const [videoLoaded, setVideoLoaded] = useState(false)

    // UI state
    const [showControls, setShowControls] = useState(true)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [showMenu, setShowMenu] = useState(false)
    const hideControlsTimeoutRef = useRef<number | null>(null)

    const [volume, setVolume] = useState(() => {
        const savedVolume = localStorage.getItem('volume')
        return savedVolume ? parseFloat(savedVolume) : initialVolume
    })

    const [playlistTitle, setPlaylistTitle] = useState(localStorage.getItem('playlistTitle') || '')
    const [playlistUrl, setPlaylistUrl] = useState(localStorage.getItem('playlistUrl') || '')

    const [bitrate, setBitrate] = useState(Number(localStorage.getItem('bitrate')))

    const audioStorage = useAudioStorageContext()

    const abortControllerRef = useRef<AbortController | null>(null)

    const [userInteracted, setUserInteracted] = useState(false)

    // Track user-initiated pause to prevent unwanted auto-resume on devicechange
    const lastUserPauseRef = useRef<number>(0)

    // Track previous track and last reported stopped track to avoid duplicate reports
    const previousTrackRef = useRef<MediaItem | undefined>(undefined)
    const lastStoppedTrackIdRef = useRef<string | undefined>(undefined)

    const [currentTrack, setCurrentTrack] = useState<MediaItem | undefined>(undefined)

    // Helper function to report playback stopped, avoiding duplicate reports
    const reportTrackStopped = useCallback(
        (track: MediaItem | undefined, currentTime: number, signal?: AbortSignal) => {
            if (!track || track.Id === lastStoppedTrackIdRef.current) {
                return
            }

            lastStoppedTrackIdRef.current = track.Id
            api.reportPlaybackStopped(track.Id, currentTime, signal)
        },
        [api]
    )

    // Update Media Session metadata
    const updateMediaSessionMetadata = useCallback(
        (track: MediaItem) => {
            if ('mediaSession' in navigator) {
                const artworkUrl = api.getImageUrl(track, 'Primary', { width: 512, height: 512 })

                navigator.mediaSession.metadata = new MediaMetadata({
                    title: track.Name || 'Unknown Track',
                    artist: track.Artists?.join(', ') || track.AlbumArtist || 'Unknown Artist',
                    album: track.Album || 'Unknown Album',
                    artwork: artworkUrl
                        ? [
                              {
                                  src: artworkUrl,
                                  sizes: '512x512',
                                  type: 'image/webp',
                              },
                          ]
                        : [],
                })
            }
        },
        [api]
    )

    const handleSeekTo = useCallback(
        async (details: MediaSessionActionDetails) => {
            if (details.seekTime !== undefined && isInitialized) {
                try {
                    await setProperty('time-pos', details.seekTime)
                } catch (error) {
                    console.error('Failed to seek:', error)
                }
            }
        },
        [isInitialized]
    )

    // Initialize MPV and observe properties
    useEffect(() => {
        let unlisten: (() => void) | undefined

        async function initMpv() {
            try {
                // Wait a bit for the window to be fully ready
                await new Promise(resolve => setTimeout(resolve, 200))

                // Initialize mpv with proper video output settings
                await init({
                    initialOptions: {
                        vo: 'gpu-next',
                        hwdec: 'auto-safe',
                        'keep-open': 'yes',
                        'force-window': 'yes',
                    },
                    observedProperties: OBSERVED_PROPERTIES,
                })

                // Listen to property changes
                unlisten = await observeProperties(OBSERVED_PROPERTIES, ({ name, data }) => {
                    console.log(`[MPV] Property changed: ${name} =`, data)

                    switch (name) {
                        case 'pause':
                            if (typeof data === 'boolean') {
                                setIsPaused(data)
                            }
                            break
                        case 'time-pos':
                            if (typeof data === 'number') {
                                setTimePos(data)
                            }
                            break
                        case 'duration':
                            if (typeof data === 'number') {
                                setDuration(data)
                                if (data > 0) setVideoLoaded(true)
                            }
                            break
                        case 'track-list':
                            if (Array.isArray(data)) {
                                const subs = data.filter((track: any) => track.type === 'sub')
                                setSubtitleTracks(subs)
                            }
                            break
                        case 'sid':
                            if (typeof data === 'number' || data === null) {
                                setCurrentSubtitleId(data)
                            }
                            break
                        case 'volume':
                            if (typeof data === 'number') {
                                setVolume(data)
                            }
                            break
                        case 'speed':
                            if (typeof data === 'number') {
                                setSpeed(data)
                            }
                            break
                    }
                })

                setIsInitialized(true)
            } catch (error) {
                console.error('Failed to initialize mpv:', error)
            }
        }

        initMpv()

        return () => {
            if (unlisten) {
                unlisten()
            }
            destroy().catch(console.error)
        }
    }, [])

    // Report playback progress to Jellyfin
    useEffect(() => {
        if (isPaused || !currentTrack) return

        const interval = setInterval(() => {
            api.reportPlaybackProgress(currentTrack.Id, timePos, false)
        }, 10000)

        return () => clearInterval(interval)
    }, [api, timePos, currentTrack, isPaused])

    // Handle login/logout and sync to localStorage
    useEffect(() => {
        if (clearOnLogout || !api.auth.token) {
            setSessionPlayCount(0)
            localStorage.removeItem('sessionPlayCount')
        } else if (api.auth.token) {
            localStorage.setItem('sessionPlayCount', sessionPlayCount.toString())
        }
    }, [api.auth.token, clearOnLogout, sessionPlayCount])

    // Force session play count to reset
    const resetSessionCount = () => {
        setSessionPlayCount(0)
        localStorage.removeItem('sessionPlayCount')
    }

    const loadVideoAndPlay = useCallback(
        async (track: MediaItem) => {
            if (!isInitialized) return

            try {
                const offlineUrl = await audioStorage.getPlayableUrl(track.Id)
                const streamUrl = api.getStreamUrl(track.Id, bitrate)

                const videoUrl = offlineUrl?.url || streamUrl

                await command('loadfile', [videoUrl])
                await setProperty('pause', false)

                setVideoLoaded(true)
            } catch (error) {
                console.error('Failed to load video:', error)
            }
        },
        [api, audioStorage, bitrate, isInitialized]
    )

    const playTrack = useCallback(async () => {
        if (!currentTrack || !isInitialized) {
            return
        }

        abortControllerRef.current?.abort('abort')
        abortControllerRef.current = new AbortController()
        const signal = abortControllerRef.current.signal

        if (!isPaused && previousTrackRef.current) {
            reportTrackStopped(previousTrackRef.current, timePos, signal)
        }

        previousTrackRef.current = currentTrack

        try {
            await loadVideoAndPlay(currentTrack)

            setSessionPlayCount(prev => prev + 1)

            updateMediaSessionMetadata(currentTrack)

            // Report playback start to Jellyfin
            api.reportPlaybackStart(currentTrack.Id, signal)
        } catch (error) {
            console.error('Error playing track:', error)
        }
    }, [
        api,
        currentTrack,
        isPaused,
        isInitialized,
        loadVideoAndPlay,
        reportTrackStopped,
        timePos,
        updateMediaSessionMetadata,
    ])

    const togglePlayPause = useCallback(async () => {
        setUserInteracted(true)

        if (!isInitialized) {
            console.warn('MPV not initialized yet')
            return
        }

        if (currentTrack) {
            try {
                console.log('Toggling play/pause. Current state:', isPaused)
                await command('cycle', ['pause'])

                if (!isPaused) {
                    lastUserPauseRef.current = Date.now()
                    api.reportPlaybackProgress(currentTrack.Id, timePos, true)
                } else {
                    api.reportPlaybackProgress(currentTrack.Id, timePos, false)
                    updateMediaSessionMetadata(currentTrack)
                }
            } catch (error) {
                console.error('Failed to toggle play/pause:', error)
            }
        }
    }, [api, currentTrack, isPaused, isInitialized, timePos, updateMediaSessionMetadata])

    const protectedPlay = useCallback(async () => {
        const timeSinceLastPause = Date.now() - lastUserPauseRef.current

        if (timeSinceLastPause < 2000) {
            console.info('Ignoring automatic play request - user recently paused')
            return
        }

        await togglePlayPause()
    }, [togglePlayPause])

    // Play track when currentTrack changes
    useEffect(() => {
        if (currentTrack?.Id && isInitialized) {
            playTrack()
        }
    }, [currentTrack?.Id, isInitialized]) // eslint-disable-line react-hooks/exhaustive-deps

    const formatTime = (seconds: number) => {
        if (isNaN(seconds) || seconds === 0) return '0:00'
        const hrs = Math.floor(seconds / 3600)
        const mins = Math.floor((seconds % 3600) / 60)
        const secs = Math.floor(seconds % 60)

        if (hrs > 0) {
            return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`
        }
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`
    }

    // Set initial volume in MPV
    useEffect(() => {
        if (isInitialized) {
            setProperty('volume', volume).catch(console.error)
        }
    }, [isInitialized]) // eslint-disable-line react-hooks/exhaustive-deps

    // Set up Media Session API for next/previous actions
    useEffect(() => {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.setActionHandler('play', protectedPlay)
            navigator.mediaSession.setActionHandler('pause', togglePlayPause)
            navigator.mediaSession.setActionHandler('seekto', handleSeekTo)

            return () => {
                navigator.mediaSession.setActionHandler('nexttrack', null)
                navigator.mediaSession.setActionHandler('previoustrack', null)
                navigator.mediaSession.setActionHandler('play', null)
                navigator.mediaSession.setActionHandler('pause', null)
                navigator.mediaSession.setActionHandler('seekto', null)
            }
        }
    }, [protectedPlay, togglePlayPause, handleSeekTo])

    // Handle cleanup on logout
    useEffect(() => {
        if (clearOnLogout && currentTrack) {
            reportTrackStopped(currentTrack, timePos)
            if (isInitialized) {
                command('stop', []).catch(console.error)
            }
        }
    }, [clearOnLogout, currentTrack, isInitialized, reportTrackStopped, timePos])

    // Video control functions
    const handleSeek = useCallback(
        async (newTime: number) => {
            if (isInitialized) {
                try {
                    await setProperty('time-pos', newTime)
                } catch (error) {
                    console.error('Failed to seek:', error)
                }
            }
        },
        [isInitialized]
    )

    const handleSubtitleChange = useCallback(
        async (subtitleId: string) => {
            if (isInitialized) {
                try {
                    if (subtitleId === 'no') {
                        await command('set', ['sid', 'no'])
                    } else {
                        await command('set', ['sid', subtitleId])
                    }
                } catch (error) {
                    console.error('Failed to change subtitle track:', error)
                }
            }
        },
        [isInitialized]
    )

    const handleVolumeChange = useCallback(
        async (newVolume: number) => {
            if (isInitialized) {
                try {
                    await setProperty('volume', newVolume)
                    localStorage.setItem('volume', newVolume.toString())
                    // Let MPV observer update the state to avoid race conditions
                } catch (error) {
                    console.error('Failed to change volume:', error)
                }
            }
        },
        [isInitialized]
    )

    const toggleMute = useCallback(async () => {
        if (!isInitialized) return
        const newValue = volume === 0 ? 100 : 0
        await setProperty('volume', newValue)
        localStorage.setItem('volume', newValue.toString())
        // Let MPV observer update the state to avoid race conditions
    }, [isInitialized, volume])

    const handleSpeedChange = useCallback(
        async (newSpeed: number) => {
            if (isInitialized) {
                try {
                    await setProperty('speed', newSpeed)
                } catch (error) {
                    console.error('Failed to change speed:', error)
                }
            }
        },
        [isInitialized]
    )

    const handleOpenFile = useCallback(
        async (filePath: string) => {
            try {
                if (isInitialized) {
                    await command('loadfile', [filePath])
                    setVideoLoaded(true)
                }
            } catch (error) {
                console.error('Failed to open file:', error)
            }
        },
        [isInitialized]
    )

    const toggleFullscreen = useCallback(async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen()
                setIsFullscreen(true)
            } else {
                await document.exitFullscreen()
                setIsFullscreen(false)
            }
        } catch (error) {
            console.error('Failed to toggle fullscreen:', error)
        }
    }, [])

    const skip = useCallback(
        async (seconds: number) => {
            if (isInitialized) {
                try {
                    await command('seek', [seconds.toString(), 'relative'])
                } catch (error) {
                    console.error('Failed to skip:', error)
                }
            }
        },
        [isInitialized]
    )

    const handleMouseMove = useCallback(() => {
        setShowControls(true)
        if (hideControlsTimeoutRef.current) {
            clearTimeout(hideControlsTimeoutRef.current)
        }
        hideControlsTimeoutRef.current = window.setTimeout(() => {
            if (!isPaused) {
                setShowControls(false)
            }
        }, 1000)
    }, [isPaused])

    const toggleMenu = useCallback(() => {
        setShowMenu(v => !v)
    }, [])

    // Keyboard controls
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (!isInitialized) return

            switch (e.key) {
                case ' ':
                    e.preventDefault()
                    togglePlayPause()
                    break
                case 'f':
                case 'F':
                    toggleFullscreen()
                    break
                case 'ArrowLeft':
                    skip(-5)
                    break
                case 'ArrowRight':
                    skip(5)
                    break
                case 'ArrowUp':
                    e.preventDefault()
                    if (volume < 100) {
                        handleVolumeChange(Math.min(100, volume + 5))
                    }
                    break
                case 'ArrowDown':
                    e.preventDefault()
                    if (volume > 0) {
                        handleVolumeChange(Math.max(0, volume - 5))
                    }
                    break
                case 'm':
                case 'M':
                    toggleMute()
                    break
            }
        }

        window.addEventListener('keydown', handleKeyPress)
        return () => window.removeEventListener('keydown', handleKeyPress)
    }, [isInitialized, volume, togglePlayPause, toggleFullscreen, skip, handleVolumeChange, toggleMute])

    const clearCurrentTrack = useCallback(async () => {
        if (currentTrack) {
            // Report playback stopped to Jellyfin
            reportTrackStopped(currentTrack, timePos)

            // Stop and clear the video
            if (isInitialized) {
                try {
                    await command('stop', [])
                    setVideoLoaded(false)
                } catch (error) {
                    console.error('Failed to stop playback:', error)
                }
            }

            // Clear the current track
            setCurrentTrack(undefined)
            previousTrackRef.current = undefined

            // Clear Media Session metadata
            if ('mediaSession' in navigator) {
                navigator.mediaSession.metadata = null
            }
        }
    }, [currentTrack, timePos, reportTrackStopped, isInitialized])

    return {
        // Track info
        currentTrack,

        // Playback state
        isPaused,
        isInitialized,
        videoLoaded,
        timePos,
        duration,

        // Playback controls
        togglePlayPause,
        playTrack: (track: MediaItem) => {
            setUserInteracted(true)
            setCurrentTrack(track)
        },
        clearCurrentTrack,
        handleSeek,
        skip,
        formatTime,

        // Volume controls
        volume,
        setVolume,
        handleVolumeChange,
        toggleMute,

        // Video controls
        speed,
        handleSpeedChange,
        handleOpenFile,

        // Subtitle controls
        subtitleTracks,
        currentSubtitleId,
        handleSubtitleChange,

        // UI state
        showControls,
        isFullscreen,
        showMenu,
        handleMouseMove,
        toggleFullscreen,
        toggleMenu,

        // Session
        sessionPlayCount,
        resetSessionCount,

        // Playlist (legacy)
        playlistTitle,
        playlistUrl,

        // Settings
        bitrate,
        setBitrate,
        rememberFilters,
        setRememberFilters,
    }
}
