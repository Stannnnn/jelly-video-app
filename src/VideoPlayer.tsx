import { open } from '@tauri-apps/plugin-dialog'
import { useEffect, useRef, useState } from 'react'
import {
    command,
    destroy,
    init,
    observeProperties,
    setProperty,
    type MpvObservableProperty,
} from 'tauri-plugin-libmpv-api'
import './VideoPlayer.css'

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

function VideoPlayer() {
    const [isPaused, setIsPaused] = useState(true)
    const [timePos, setTimePos] = useState(0)
    const [duration, setDuration] = useState(0)
    const [isInitialized, setIsInitialized] = useState(false)
    const [subtitleTracks, setSubtitleTracks] = useState<SubtitleTrack[]>([])
    const [currentSubtitleId, setCurrentSubtitleId] = useState<number | null>(null)
    const [volume, setVolume] = useState(100)
    const [speed, setSpeed] = useState(1.0)
    const [showControls, setShowControls] = useState(true)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [videoLoaded, setVideoLoaded] = useState(false)
    const hideControlsTimeoutRef = useRef<number | null>(null)

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
                        // vo: 'gpu',
                        // hwdec: 'auto',
                        // 'keep-open': 'yes',
                        // 'force-window': 'yes',
                        // 'video-sync': 'display-resample',
                        // 'sub-auto': 'fuzzy',
                        // 'sub-file-paths': 'sub:subtitles:subs',
                        // 'slang': 'en,eng',
                        // 'osd-level': '1',
                        // 'osd-bar': 'yes',
                        // 'osd-on-seek': 'msg-bar',
                        // 'gpu-api': 'auto',
                        // 'gpu-context': 'auto',
                    },
                    observedProperties: OBSERVED_PROPERTIES,
                })

                // Listen to property changes
                unlisten = await observeProperties(OBSERVED_PROPERTIES, ({ name, data }) => {
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

    const togglePlayPause = async () => {
        if (isInitialized) {
            try {
                console.log('Toggling play/pause. Current state:', isPaused)
                await command('cycle', ['pause'])
            } catch (error) {
                console.error('Failed to toggle play/pause:', error)
            }
        } else {
            console.warn('MPV not initialized yet')
        }
    }

    const handleSeek = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isInitialized) {
            try {
                const newTime = parseFloat(e.target.value)
                await setProperty('time-pos', newTime)
            } catch (error) {
                console.error('Failed to seek:', error)
            }
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const handleSubtitleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (isInitialized) {
            try {
                const value = e.target.value
                if (value === 'no') {
                    await command('set', ['sid', 'no'])
                } else {
                    await command('set', ['sid', value])
                }
            } catch (error) {
                console.error('Failed to change subtitle track:', error)
            }
        }
    }

    const handleVolumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isInitialized) {
            try {
                const newVolume = parseInt(e.target.value)
                await setProperty('volume', newVolume)
            } catch (error) {
                console.error('Failed to change volume:', error)
            }
        }
    }

    const handleSpeedChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (isInitialized) {
            try {
                const newSpeed = parseFloat(e.target.value)
                await setProperty('speed', newSpeed)
            } catch (error) {
                console.error('Failed to change speed:', error)
            }
        }
    }

    const handleOpenFile = async () => {
        try {
            const selected = await open({
                multiple: false,
                filters: [
                    {
                        name: 'Video',
                        extensions: ['mp4', 'mkv', 'avi', 'mov', 'webm', 'flv', 'wmv', 'm4v'],
                    },
                ],
            })
            if (selected && isInitialized) {
                await command('loadfile', [selected as string])
                setVideoLoaded(false)
            }
        } catch (error) {
            console.error('Failed to open file:', error)
        }
    }

    const toggleFullscreen = async () => {
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
    }

    const skip = async (seconds: number) => {
        if (isInitialized) {
            try {
                await command('seek', [seconds.toString(), 'relative'])
            } catch (error) {
                console.error('Failed to skip:', error)
            }
        }
    }

    const handleMouseMove = () => {
        setShowControls(true)
        if (hideControlsTimeoutRef.current) {
            clearTimeout(hideControlsTimeoutRef.current)
        }
        hideControlsTimeoutRef.current = window.setTimeout(() => {
            if (!isPaused) {
                setShowControls(false)
            }
        }, 3000)
    }

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
                        setProperty('volume', Math.min(100, volume + 5))
                    }
                    break
                case 'ArrowDown':
                    e.preventDefault()
                    if (volume > 0) {
                        setProperty('volume', Math.max(0, volume - 5))
                    }
                    break
                case 'm':
                case 'M':
                    setProperty('volume', volume === 0 ? 100 : 0)
                    break
            }
        }

        window.addEventListener('keydown', handleKeyPress)
        return () => window.removeEventListener('keydown', handleKeyPress)
    }, [isInitialized, volume, isPaused])

    return (
        <div className="video-container" onMouseMove={handleMouseMove}>
            {!videoLoaded && (
                <div className="no-video-overlay">
                    <button onClick={handleOpenFile} className="open-file-btn">
                        📁 Open Video File
                    </button>
                    <p className="keyboard-hint">
                        Keyboard shortcuts: Space (play/pause), F (fullscreen), ←→ (skip 5s), ↑↓ (volume), M (mute)
                    </p>
                </div>
            )}
            <div className={`controls-overlay ${showControls || isPaused ? 'visible' : 'hidden'}`}>
                <div className="top-controls">
                    <button onClick={handleOpenFile} className="control-btn" title="Open File">
                        📁
                    </button>
                    <button onClick={toggleFullscreen} className="control-btn" title="Fullscreen (F)">
                        {isFullscreen ? '🗗' : '⛶'}
                    </button>
                </div>
                <div className="main-controls">
                    <button onClick={() => skip(-10)} className="control-btn" title="Skip -10s">
                        ⏪
                    </button>
                    <button onClick={togglePlayPause} className="play-pause-btn" title="Play/Pause (Space)">
                        {isPaused ? '▶' : '⏸'}
                    </button>
                    <button onClick={() => skip(10)} className="control-btn" title="Skip +10s">
                        ⏩
                    </button>
                </div>
                <div className="seek-bar">
                    <span className="time">{formatTime(timePos)}</span>
                    <input
                        type="range"
                        min="0"
                        max={duration || 0}
                        value={timePos}
                        onChange={handleSeek}
                        step="0.1"
                        className="slider"
                        title="Seek"
                    />
                    <span className="time">{formatTime(duration)}</span>
                </div>
                <div className="bottom-controls">
                    <div className="volume-control">
                        <span className="control-label">🔊</span>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={volume}
                            onChange={handleVolumeChange}
                            className="volume-slider"
                            title="Volume (↑↓)"
                        />
                        <span className="volume-value">{volume}%</span>
                    </div>
                    <div className="speed-control">
                        <label htmlFor="speed-select" className="control-label">
                            Speed:
                        </label>
                        <select
                            id="speed-select"
                            value={speed}
                            onChange={handleSpeedChange}
                            className="speed-dropdown"
                            title="Playback Speed"
                        >
                            <option value="0.25">0.25x</option>
                            <option value="0.5">0.5x</option>
                            <option value="0.75">0.75x</option>
                            <option value="1">1x</option>
                            <option value="1.25">1.25x</option>
                            <option value="1.5">1.5x</option>
                            <option value="1.75">1.75x</option>
                            <option value="2">2x</option>
                        </select>
                    </div>
                    {subtitleTracks.length > 0 && (
                        <div className="subtitle-selector">
                            <label htmlFor="subtitle-select" className="control-label">
                                Subs:
                            </label>
                            <select
                                id="subtitle-select"
                                value={currentSubtitleId?.toString() || 'no'}
                                onChange={handleSubtitleChange}
                                className="subtitle-dropdown"
                                title="Subtitles"
                            >
                                <option value="no">None</option>
                                {subtitleTracks.map(track => (
                                    <option key={track.id} value={track.id}>
                                        {track.title || track.lang || `Track ${track.id}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default VideoPlayer
