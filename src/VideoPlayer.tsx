import {
    ArrowLeftIcon,
    ArrowsPointingInIcon,
    ArrowsPointingOutIcon,
    Cog8ToothIcon,
    PauseIcon,
    PlayCircleIcon,
    PlayIcon,
    SpeakerWaveIcon,
    SpeakerXMarkIcon,
} from '@heroicons/react/20/solid'
import { ChevronRightIcon } from '@primer/octicons-react'
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
    const [showMenu, setShowMenu] = useState(false)

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

    const toggleMute = async () => {
        if (!isInitialized) return
        const newValue = volume === 0 ? 100 : 0
        await setProperty('volume', newValue)
    }

    const toggleMenu = () => {
        setShowMenu(v => !v)
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
        }, 1000)
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
        <div className={isPaused ? 'video-container' : 'video-container playing'} onMouseMove={handleMouseMove}>
            {!videoLoaded && (
                <div className="no-video-overlay">
                    <button onClick={handleOpenFile} className="open-file-btn">
                        📁 Open Video File
                    </button>
                </div>
            )}

            <div className={`video-header ${showControls || isPaused ? 'visible' : 'hidden'}`}>
                <div className="return" title="Return">
                    <ArrowLeftIcon className="heroicons" />
                </div>
                <div className="video-title">Giant (1956)</div>
            </div>

            <div className="video-play-icon">
                <PlayCircleIcon className="heroicons" />
            </div>

            <div className={`video-controls ${showControls || isPaused ? 'visible' : 'hidden'}`}>
                <div className="playback">
                    <button
                        onClick={togglePlayPause}
                        className="play-pause controls-btn"
                        title={isPaused ? 'Play (Space)' : 'Pause (Space)'}
                    >
                        {isPaused ? <PlayIcon className="heroicons" /> : <PauseIcon className="heroicons" />}
                    </button>
                </div>
                <div className="progress">
                    <span className="time">{formatTime(timePos)}</span>
                    <div className="progress-container">
                        <input
                            type="range"
                            min="0"
                            max={duration || 0}
                            value={timePos}
                            onChange={handleSeek}
                            step="0.1"
                            className="progress-bar"
                        />
                        <div className="progress-indicator controls-tooltip" style={{ left: `${volume}%` }}>
                            {volume}%
                        </div>
                    </div>
                    <span className="time">{formatTime(duration)}</span>
                </div>
                <div className="volume">
                    <button
                        className="volume-toggle controls-btn"
                        onClick={toggleMute}
                        title={volume === 0 ? 'Unmute (M)' : 'Mute (M)'}
                    >
                        {volume === 0 ? (
                            <SpeakerXMarkIcon className="heroicons" />
                        ) : (
                            <SpeakerWaveIcon className="heroicons" />
                        )}
                    </button>
                    <div className="volume-container">
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={volume}
                            onChange={handleVolumeChange}
                            className="volume-bar"
                        />
                        <div className="volume-indicator controls-tooltip" style={{ left: `${volume}%` }}>
                            {volume}%
                        </div>
                    </div>
                </div>
                <div className="actions">
                    <div className="video-menu">
                        <button
                            className={showMenu ? 'menu-toggle controls-btn active' : 'menu-toggle controls-btn'}
                            onClick={toggleMenu}
                            title="Settings"
                        >
                            <Cog8ToothIcon className="heroicons" />
                        </button>
                        <div className="menu-container">
                            {subtitleTracks.length > 0 && (
                                <div className="menu-item">
                                    <div className="text">Subtitles</div>
                                    <ChevronRightIcon className="heroicons" />
                                    <select
                                        id="subtitle-select"
                                        value={currentSubtitleId?.toString() || 'no'}
                                        onChange={handleSubtitleChange}
                                        className="subtitle-dropdown"
                                        title="Subtitles"
                                    >
                                        <option value="no">Disabled</option>
                                        {subtitleTracks.map(track => (
                                            <option key={track.id} value={track.id}>
                                                {track.title || track.lang || `Track ${track.id}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="menu-item">
                                <div className="text">Speed</div>
                                <ChevronRightIcon className="heroicons" />
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

                            <div className="menu-item">
                                <div className="text">Statistics</div>
                                <ChevronRightIcon className="heroicons" />
                            </div>
                        </div>
                    </div>
                    <div className="fullscreen">
                        <button
                            onClick={toggleFullscreen}
                            className="controls-btn"
                            title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
                        >
                            {isFullscreen ? (
                                <ArrowsPointingInIcon className="heroicons" />
                            ) : (
                                <ArrowsPointingOutIcon className="heroicons" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default VideoPlayer
