import {
    ArrowLeftIcon,
    ArrowsPointingInIcon,
    ArrowsPointingOutIcon,
    CheckIcon,
    Cog8ToothIcon,
    PauseIcon,
    PlayCircleIcon,
    PlayIcon,
    SpeakerWaveIcon,
    SpeakerXMarkIcon,
} from '@heroicons/react/20/solid'
import { ChevronRightIcon } from '@primer/octicons-react'
import { useEffect, useRef, useState } from 'react'
import { useJellyfinContext } from './context/JellyfinContext/JellyfinContext'
import { usePlaybackContext } from './context/PlaybackContext/PlaybackContext'
import './VideoPlayer.css'

type MenuView = 'main' | 'subtitles' | 'speed' | 'statistics'

export const VideoPlayer = () => {
    const api = useJellyfinContext()
    const {
        isPaused,
        timePos,
        duration,
        isInitialized,
        videoLoaded,
        volume,
        speed,
        subtitleTracks,
        currentSubtitleId,
        showControls,
        isFullscreen,
        showMenu,
        togglePlayPause,
        currentTrack,
        clearCurrentTrack,
        handleSeek,
        skip,
        formatTime,
        handleVolumeChange,
        toggleMute,
        handleSpeedChange,
        handleSubtitleChange,
        toggleFullscreen,
        handleMouseMove,
        toggleMenu,
    } = usePlaybackContext()

    const [previewTime, setPreviewTime] = useState<number | null>(null)
    const [previewPosition, setPreviewPosition] = useState(0)
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
    const [previewImageError, setPreviewImageError] = useState(false)
    const [trickplayTile, setTrickplayTile] = useState<{
        url: string
        tileWidth: number
        tileHeight: number
        col: number
        row: number
        tilesPerRow: number
    } | null>(null)
    const progressBarRef = useRef<HTMLInputElement>(null)
    const [isHoveringControls, setIsHoveringControls] = useState(false)
    const [currentMenuView, setCurrentMenuView] = useState<MenuView>('main')
    const [menuTransition, setMenuTransition] = useState<'none' | 'forward' | 'backward'>('none')

    const shouldShowControls = showControls || isPaused || isHoveringControls

    // Reset menu view when menu closes
    useEffect(() => {
        if (!showMenu) {
            // Small delay to let close animation finish
            const timer = setTimeout(() => {
                setCurrentMenuView('main')
                setMenuTransition('none')
            }, 320)
            return () => clearTimeout(timer)
        }
    }, [showMenu])

    // Hide controls when window loses focus (disabled in dev so F12 debugging doesn't hide controls)
    useEffect(() => {
        if (import.meta.env.DEV) return

        const handleBlur = () => {
            setIsHoveringControls(false)
        }

        window.addEventListener('blur', handleBlur)
        return () => window.removeEventListener('blur', handleBlur)
    }, [])

    const handleContainerClick = () => {
        if (isPaused && videoLoaded) {
            togglePlayPause()
        }
    }

    const handleProgressMouseEnter = () => {
        setPreviewTime(null)
        setPreviewImageUrl(null)
        setPreviewImageError(false)
        setTrickplayTile(null)
    }

    const handleProgressMouseMove = (e: React.MouseEvent<HTMLInputElement>) => {
        if (!progressBarRef.current || !duration || !currentTrack) return

        const rect = progressBarRef.current.getBoundingClientRect()
        const offsetX = e.clientX - rect.left
        const percentage = Math.max(0, Math.min(1, offsetX / rect.width))
        const time = percentage * duration

        setPreviewTime(time)
        // Clamp preview position to keep it on screen (80px on each side for the thumbnail width/2)
        const clampedPercentage = Math.max(10, Math.min(90, percentage * 100))
        setPreviewPosition(clampedPercentage)

        // Get trickplay preview image - only if trickplay data is available
        if (currentTrack.Trickplay) {
            // Get the first available width from trickplay data
            const trickplayHash = Object.keys(currentTrack.Trickplay)[0]
            const availableWidth = trickplayHash ? Number(Object.keys(currentTrack.Trickplay[trickplayHash])[0]) : null
            const tileData = availableWidth ? api.getTrickplayUrl(currentTrack, time, availableWidth) : null

            if (tileData) {
                setTrickplayTile(tileData)
                setPreviewImageUrl(tileData.url)
                setPreviewImageError(false)
            }
        }
    }

    return (
        <div className={isPaused ? 'video-container' : 'video-container playing'} onMouseMove={handleMouseMove}>
            <div
                className={`video-header ${shouldShowControls ? 'visible' : 'hidden'}`}
                onMouseEnter={() => setIsHoveringControls(true)}
                onMouseLeave={() => setIsHoveringControls(false)}
            >
                <button className="return" title="Return" onClick={clearCurrentTrack}>
                    <ArrowLeftIcon className="heroicons" />
                </button>
                <div className="video-title">
                    {currentTrack?.Name || 'Unknown Title'}
                    {currentTrack?.PremiereDate && ` (${new Date(currentTrack.PremiereDate).getFullYear()})`}
                </div>
            </div>

            <div className="video-play-icon noSelect" onClick={handleContainerClick}>
                <PlayCircleIcon className="heroicons" />
            </div>

            <div
                className={`video-controls noSelect ${shouldShowControls ? 'visible' : 'hidden'}`}
                onMouseEnter={() => setIsHoveringControls(true)}
                onMouseLeave={() => setIsHoveringControls(false)}
            >
                <div className="playback">
                    <button
                        onClick={() => {
                            togglePlayPause()
                        }}
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
                            ref={progressBarRef}
                            type="range"
                            min="0"
                            max={duration || 0}
                            value={timePos}
                            onChange={e => handleSeek(parseFloat(e.target.value))}
                            onMouseEnter={handleProgressMouseEnter}
                            onMouseMove={handleProgressMouseMove}
                            step="0.1"
                            className="progress-bar"
                        />
                        <div
                            className={
                                (previewTime === null ? 'progress-preview' : 'progress-preview active') +
                                (isHoveringControls ? '' : ' hidden')
                            }
                            style={{ left: `${previewPosition}%` }}
                        >
                            <div className="preview-thumbnail">
                                <div
                                    style={{
                                        width: `${trickplayTile?.tileWidth || 0}px`,
                                        height: `${trickplayTile?.tileHeight || 0}px`,
                                        overflow: 'hidden',
                                    }}
                                >
                                    <img
                                        src={previewImageUrl || ''}
                                        alt="Preview"
                                        onError={() => setPreviewImageError(true)}
                                        loading="eager"
                                        style={{
                                            transform: `translate(-${
                                                (trickplayTile?.col || 0) * (trickplayTile?.tileWidth || 0)
                                            }px, -${(trickplayTile?.row || 0) * (trickplayTile?.tileHeight || 0)}px)`,
                                            display: 'block',
                                        }}
                                    />
                                </div>
                                <div
                                    className={
                                        previewImageUrl && !previewImageError && trickplayTile
                                            ? 'preview-placeholder hidden'
                                            : 'preview-placeholder'
                                    }
                                >
                                    Preview
                                </div>
                            </div>
                            <div className="preview-time">{previewTime !== null ? formatTime(previewTime) : ''}</div>
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
                            onChange={e => handleVolumeChange(parseInt(e.target.value))}
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
                            <div className="quality-label">HD {/* 4K/HD/SD */}</div>
                        </button>
                        <div className={`menu-container ${menuTransition}`}>
                            {/* Main Menu */}
                            <div className={`menu-view ${currentMenuView === 'main' ? 'active' : 'inactive-left'}`}>
                                {subtitleTracks.length > 0 && (
                                    <div
                                        className="menu-item"
                                        onClick={() => {
                                            setMenuTransition('forward')
                                            setCurrentMenuView('subtitles')
                                        }}
                                    >
                                        <div className="text">Subtitles</div>
                                        <div className="menu-item-right">
                                            <span className="menu-item-value">
                                                {currentSubtitleId === null
                                                    ? 'Off'
                                                    : subtitleTracks.find(t => t.id === currentSubtitleId)?.title ||
                                                      subtitleTracks.find(t => t.id === currentSubtitleId)?.lang ||
                                                      'On'}
                                            </span>
                                            <ChevronRightIcon className="heroicons" />
                                        </div>
                                    </div>
                                )}

                                <div
                                    className="menu-item"
                                    onClick={() => {
                                        setMenuTransition('forward')
                                        setCurrentMenuView('speed')
                                    }}
                                >
                                    <div className="text">Speed</div>
                                    <div className="menu-item-right">
                                        <span className="menu-item-value">{speed}x</span>
                                        <ChevronRightIcon className="heroicons" />
                                    </div>
                                </div>

                                <div
                                    className="menu-item"
                                    onClick={() => {
                                        setMenuTransition('forward')
                                        setCurrentMenuView('statistics')
                                    }}
                                >
                                    <div className="text">Statistics</div>
                                    <ChevronRightIcon className="heroicons" />
                                </div>
                            </div>

                            {/* Subtitles Submenu */}
                            <div
                                className={`menu-view ${currentMenuView === 'subtitles' ? 'active' : 'inactive-right'}`}
                            >
                                <div
                                    className="menu-item back-button"
                                    onClick={() => {
                                        setMenuTransition('backward')
                                        setCurrentMenuView('main')
                                    }}
                                >
                                    <ArrowLeftIcon className="heroicons back-icon" />
                                    <div className="text">Subtitles</div>
                                </div>
                                <div className="menu-divider"></div>
                                <div
                                    className={`menu-item ${currentSubtitleId === null ? 'selected' : ''}`}
                                    onClick={() => handleSubtitleChange('no')}
                                >
                                    <div className="text">Disabled</div>
                                    {currentSubtitleId === null && <CheckIcon className="heroicons check-icon" />}
                                </div>
                                {subtitleTracks.map(track => (
                                    <div
                                        key={track.id}
                                        className={`menu-item ${currentSubtitleId === track.id ? 'selected' : ''}`}
                                        onClick={() => handleSubtitleChange(track.id.toString())}
                                    >
                                        <div className="text">{track.title || track.lang || `Track ${track.id}`}</div>
                                        {currentSubtitleId === track.id && (
                                            <CheckIcon className="heroicons check-icon" />
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Speed Submenu */}
                            <div className={`menu-view ${currentMenuView === 'speed' ? 'active' : 'inactive-right'}`}>
                                <div
                                    className="menu-item back-button"
                                    onClick={() => {
                                        setMenuTransition('backward')
                                        setCurrentMenuView('main')
                                    }}
                                >
                                    <ArrowLeftIcon className="heroicons back-icon" />
                                    <div className="text">Speed</div>
                                </div>
                                <div className="menu-divider"></div>
                                {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(speedValue => (
                                    <div
                                        key={speedValue}
                                        className={`menu-item ${speed === speedValue ? 'selected' : ''}`}
                                        onClick={() => handleSpeedChange(speedValue)}
                                    >
                                        <div className="text">{speedValue}x</div>
                                        {speed === speedValue && <CheckIcon className="heroicons check-icon" />}
                                    </div>
                                ))}
                            </div>

                            {/* Statistics Submenu */}
                            <div
                                className={`menu-view ${
                                    currentMenuView === 'statistics' ? 'active' : 'inactive-right'
                                }`}
                            >
                                <div
                                    className="menu-item back-button"
                                    onClick={() => {
                                        setMenuTransition('backward')
                                        setCurrentMenuView('main')
                                    }}
                                >
                                    <ArrowLeftIcon className="heroicons back-icon" />
                                    <div className="text">Statistics</div>
                                </div>
                                <div className="menu-divider"></div>
                                <div className="menu-item stats-item">
                                    <div className="text">Resolution</div>
                                    <div className="menu-item-value">1920x1080</div>
                                </div>
                                <div className="menu-item stats-item">
                                    <div className="text">Bitrate</div>
                                    <div className="menu-item-value">5.2 Mbps</div>
                                </div>
                                <div className="menu-item stats-item">
                                    <div className="text">Codec</div>
                                    <div className="menu-item-value">H.264</div>
                                </div>
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
