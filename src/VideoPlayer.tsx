import { ArrowLeftIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon } from '@primer/octicons-react'
import { useCallback, useEffect, useRef, useState, WheelEvent } from 'react'
import { MediaItem } from './api/jellyfin'
import { Loader } from './components/Loader'
import { SubtitleTrack } from './components/PlaybackManager'
import {
    GearIcon,
    MaximizeIcon,
    MinimizeIcon,
    PauseIcon,
    PlayIcon,
    SpeakerHighIcon,
    SpeakerLowIcon,
    SpeakerMuteIcon,
    VideoPlayIcon,
} from './components/SvgIcons'
import { useHistoryContext } from './context/HistoryContext/HistoryContext'
import { useJellyfinContext } from './context/JellyfinContext/JellyfinContext'
import { usePlaybackContext } from './context/PlaybackContext/PlaybackContext'
import './VideoPlayer.css'

type MenuView = 'home' | 'subtitles' | 'speed' | 'statistics'

const getSubtitleDisplayName = (
    subtitleId: number | null,
    subtitleTracks: SubtitleTrack[],
    currentTrack: MediaItem | null | undefined
) => {
    if (subtitleId === null) return 'Disabled'

    const track = subtitleTracks.find(t => t.id === subtitleId)
    if (!track) return 'On'

    // Find the matching MediaStream by ff-index (which corresponds to MediaStream Index)
    const mediaStream = currentTrack?.MediaStreams?.find(
        stream => stream.Type === 'Subtitle' && stream.Index === track['ff-index']
    )

    // Use DisplayTitle from MediaStream if available, otherwise fall back to track properties
    return mediaStream?.DisplayTitle || track.title || track.lang || 'On'
}

export const VideoPlayer = () => {
    const api = useJellyfinContext()
    const {
        isPaused,
        timePos,
        duration,
        isInitialized,
        videoLoaded,
        isBuffering,
        cacheDuration,
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
        videoCodec,
        audioCodec,
        videoWidth,
        videoHeight,
        fps,
        videoBitrate,
        audioBitrate,
        audioChannels,
        audioSampleRate,
        hwdec,
        containerFps,
        videoFormat,
        audioCodecName,
        fileSize,
    } = usePlaybackContext()

    const { goBack: previousPage } = useHistoryContext()
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
    const menuRef = useRef<HTMLDivElement>(null)
    const [isHoveringProgress, setIsHoveringProgress] = useState(false)
    const [isHoveringControls, setIsHoveringControls] = useState(false)
    const [currentMenuView, setCurrentMenuView] = useState<MenuView>('home')
    const menuContainerRef = useRef<HTMLDivElement | null>(null)

    const shouldShowControls = showControls || showMenu || isPaused || isHoveringProgress || isHoveringControls

    // Update CSS custom properties for progress and volume bars
    useEffect(() => {
        if (progressBarRef.current && duration) {
            const progressPercent = (timePos / duration) * 100
            progressBarRef.current.style.setProperty('--progress-percent', `${progressPercent}%`)

            // Calculate buffer position (current position + cache duration)
            const bufferEnd = timePos + cacheDuration
            const bufferPercent = Math.min((bufferEnd / duration) * 100, 100)
            progressBarRef.current.style.setProperty('--buffer-percent', `${bufferPercent}%`)
        }
    }, [timePos, duration, cacheDuration])

    useEffect(() => {
        const volumeBar = document.querySelector('.volume-bar') as HTMLInputElement
        if (volumeBar) {
            volumeBar.style.setProperty('--volume-percent', `${volume}%`)
        }
    }, [volume])

    // Format bitrate in Mbps or Kbps
    const formatBitrate = (bitrate: number) => {
        if (bitrate === 0) return 'N/A'
        if (bitrate >= 1000000) {
            return `${(bitrate / 1000000).toFixed(2)} Mbps`
        }
        return `${(bitrate / 1000).toFixed(0)} Kbps`
    }

    // Format file size
    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return 'N/A'
        const units = ['B', 'KB', 'MB', 'GB', 'TB']
        const i = Math.floor(Math.log(bytes) / Math.log(1024))
        return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`
    }

    // Format sample rate
    const formatSampleRate = (rate: number) => {
        if (rate === 0) return 'N/A'
        return `${(rate / 1000).toFixed(1)} kHz`
    }

    // Get audio channel configuration
    const getAudioChannelConfig = (channels: number) => {
        if (channels === 0) return 'N/A'
        const configs: { [key: number]: string } = {
            1: 'Mono',
            2: 'Stereo',
            6: '5.1',
            8: '7.1',
        }
        return configs[channels] || `${channels} channels`
    }

    // Get quality label based on resolution, Note: we should fetch this from Jellyfin in the future
    const getQualityLabel = () => {
        if (!videoWidth || !videoHeight) return 'SD'

        const mp = (videoWidth * videoHeight) / 1_000_000

        if ((videoWidth >= 3800 && videoHeight >= 1600) || mp >= 7.5) {
            return '4K'
        }

        if (videoHeight >= 1080 || mp >= 2) return 'HD'
        if (videoHeight >= 720) return 'HD'

        return 'SD'
    }

    // Format codec name to be more readable
    const formatCodecName = (codec: string) => {
        if (codec === 'N/A' || !codec) return 'N/A'
        const codecMap: { [key: string]: string } = {
            h264: 'H.264',
            hevc: 'H.265',
            av1: 'AV1',
            vp9: 'VP9',
            aac: 'AAC',
            mp3: 'MP3',
            opus: 'Opus',
            vorbis: 'Vorbis',
            ac3: 'AC-3',
            eac3: 'E-AC-3',
            dts: 'DTS',
        }
        return codecMap[codec.toLowerCase()] || codec.toUpperCase()
    }

    // Helper function for menu animations
    function measureElement(el: HTMLDivElement) {
        // Save original inline styles
        const oldDisplay = el.style.display
        const oldVisibility = el.style.visibility
        const oldPosition = el.style.position

        // Force measurable state
        el.style.display = 'flex'
        el.style.visibility = 'hidden'
        el.style.position = 'absolute'

        const rect = el.getBoundingClientRect()

        // Restore original inline styles
        el.style.display = oldDisplay
        el.style.visibility = oldVisibility
        el.style.position = oldPosition

        return rect
    }

    const animateMenu = useCallback(() => {
        if (!showMenu) return

        const container = menuContainerRef.current
        const activeView = viewsRef.current[currentMenuView]
        if (!container || !activeView) return

        // Wait for the DOM to update
        requestAnimationFrame(() => {
            const rect = measureElement(activeView)
            container.style.width = rect.width + 'px'
            container.style.height = rect.height + 'px'
        })
    }, [currentMenuView, showMenu])

    // Handle outside click to close menu
    useEffect(() => {
        if (!showMenu) return

        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setCurrentMenuView('home')
                animateMenu()
                toggleMenu()
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showMenu, toggleMenu])

    // Reset menu view when menu closes
    useEffect(() => {
        if (!showMenu) {
            // Small delay to let close animation finish
            const timer = setTimeout(() => {
                setCurrentMenuView('home')
            }, 320)
            return () => clearTimeout(timer)
        }
    }, [showMenu])

    // Helper for menu animations
    const viewsRef = useRef<Record<MenuView, HTMLDivElement | null>>({
        home: null,
        subtitles: null,
        speed: null,
        statistics: null,
    })

    // Menu animations
    useEffect(() => {
        animateMenu()
    }, [animateMenu])

    // Hide controls when window loses focus (disabled in dev so F12 debugging doesn't hide controls)
    useEffect(() => {
        if (import.meta.env.DEV) return

        const handleBlur = () => {
            setIsHoveringProgress(false)
            setIsHoveringControls(false)
        }

        window.addEventListener('blur', handleBlur)
        return () => window.removeEventListener('blur', handleBlur)
    }, [])

    const handleContainerClick = () => {
        if (isPaused && videoLoaded && currentTrack) {
            togglePlayPause()
        }
    }

    const handleProgressMouseEnter = () => {
        setPreviewTime(null)
        setPreviewImageUrl(null)
        setPreviewImageError(false)
        setTrickplayTile(null)
    }

    const handleVolumeScroll = (e: WheelEvent<HTMLDivElement>) => {
        e.stopPropagation()
        const step = e.deltaY > 0 ? -4 : 4
        const newVolume = Math.max(0, Math.min(100, volume + step))
        handleVolumeChange(newVolume)
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
        <div
            className={isPaused ? 'video-container noSelect' : 'video-container noSelect playing'}
            onMouseMove={handleMouseMove}
        >
            <div
                className={`video-header ${shouldShowControls ? 'visible' : 'hidden'}`}
                onMouseEnter={() => setIsHoveringControls(true)}
                onMouseLeave={() => setIsHoveringControls(false)}
            >
                <button className="return" title="Return" onClick={previousPage}>
                    <ArrowLeftIcon size={20} className="return-icon" />
                </button>
                <div className="video-title">
                    {currentTrack?.Name || 'Unknown Title'}
                    {currentTrack?.PremiereDate && ` (${new Date(currentTrack.PremiereDate).getFullYear()})`}
                </div>
            </div>

            <div className="video-overlay">
                <div className="container">
                    {videoLoaded && currentTrack && !isBuffering && (
                        <div className="video-play-icon" onClick={handleContainerClick}>
                            <VideoPlayIcon width={42} height={42} />
                        </div>
                    )}
                    {(!videoLoaded || !currentTrack || isBuffering) && <Loader />}
                </div>
            </div>

            <div
                className={`video-controls ${shouldShowControls ? 'visible' : 'hidden'}`}
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
                        {isPaused ? <PlayIcon width={18} height={18} /> : <PauseIcon width={18} height={18} />}
                    </button>
                </div>
                <div className="progress">
                    <span className="time">{formatTime(timePos)}</span>
                    <div
                        className="progress-container"
                        onMouseEnter={() => setIsHoveringProgress(true)}
                        onMouseLeave={() => setIsHoveringProgress(false)}
                    >
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
                                (isHoveringProgress ? '' : ' hidden')
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
                                    {previewImageUrl && (
                                        <img
                                            src={previewImageUrl}
                                            alt="Preview"
                                            onError={() => setPreviewImageError(true)}
                                            loading="eager"
                                            style={{
                                                transform: `translate(-${
                                                    (trickplayTile?.col || 0) * (trickplayTile?.tileWidth || 0)
                                                }px, -${
                                                    (trickplayTile?.row || 0) * (trickplayTile?.tileHeight || 0)
                                                }px)`,
                                                display: 'block',
                                            }}
                                        />
                                    )}
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
                                <div className="shadow-border"></div>
                            </div>
                            <div className="preview-time">{previewTime !== null ? formatTime(previewTime) : ''}</div>
                        </div>
                    </div>
                    <span className="time">{formatTime(duration)}</span>
                </div>
                <div className="actions">
                    <div className="volume">
                        <button
                            className="volume-toggle controls-btn"
                            onClick={toggleMute}
                            title={volume === 0 ? 'Unmute (M)' : 'Mute (M)'}
                        >
                            {volume === 0 ? (
                                <SpeakerMuteIcon width={18} height={18} />
                            ) : volume < 50 ? (
                                <SpeakerLowIcon width={18} height={18} />
                            ) : (
                                <SpeakerHighIcon width={18} height={18} />
                            )}

                            {volume === 0 ? (
                                ''
                            ) : volume < 10 ? (
                                <div className="volume-indicator" title="Volume percentage">
                                    0{volume}
                                </div>
                            ) : (
                                <div className="volume-indicator" title="Volume percentage">
                                    {volume}
                                </div>
                            )}
                        </button>
                        <div className="volume-container">
                            <div className="volume-wrapper" onWheel={handleVolumeScroll}>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={volume}
                                    onChange={e => handleVolumeChange(parseInt(e.target.value))}
                                    className="volume-bar"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="video-menu" ref={menuRef}>
                        <button
                            className={showMenu ? 'menu-toggle controls-btn active' : 'menu-toggle controls-btn'}
                            onClick={toggleMenu}
                            title="Settings"
                        >
                            <GearIcon width={18} height={18} />
                            <div className="quality-label">{getQualityLabel()}</div>
                        </button>
                        <div className="menu-container" ref={menuContainerRef}>
                            {/* Home Menu */}
                            <div
                                ref={el => {
                                    viewsRef.current.home = el
                                }}
                                className={`menu-view home ${currentMenuView === 'home' ? 'active' : 'hidden'}`}
                            >
                                {subtitleTracks.length > 0 && (
                                    <div
                                        className="menu-item"
                                        onClick={() => {
                                            setCurrentMenuView('subtitles')
                                        }}
                                    >
                                        <div className="text">Subtitles</div>
                                        <div className="menu-item-right">
                                            <div className="menu-item-value">
                                                {getSubtitleDisplayName(
                                                    currentSubtitleId,
                                                    subtitleTracks,
                                                    currentTrack
                                                )}
                                            </div>
                                            <ChevronRightIcon size={16} className="icon" />
                                        </div>
                                    </div>
                                )}

                                <div
                                    className="menu-item"
                                    onClick={() => {
                                        setCurrentMenuView('speed')
                                    }}
                                >
                                    <div className="text">Speed</div>
                                    <div className="menu-item-right">
                                        <div className="menu-item-value">{speed === 1 ? 'Normal' : `${speed}x`}</div>
                                        <ChevronRightIcon size={16} className="icon" />
                                    </div>
                                </div>

                                <div
                                    className="menu-item"
                                    onClick={() => {
                                        setCurrentMenuView('statistics')
                                    }}
                                >
                                    <div className="text">Statistics</div>
                                    <div className="menu-item-right">
                                        <ChevronRightIcon size={16} className="icon" />
                                    </div>
                                </div>
                            </div>

                            {/* Subtitles Submenu */}
                            <div
                                ref={el => {
                                    viewsRef.current.subtitles = el
                                }}
                                className={`menu-view subs ${currentMenuView === 'subtitles' ? 'active' : 'hidden'}`}
                            >
                                <div
                                    className="menu-item back-button"
                                    onClick={() => {
                                        setCurrentMenuView('home')
                                    }}
                                >
                                    <ChevronLeftIcon size={16} className="return-icon" />
                                    <div className="text">Subtitles</div>
                                </div>
                                <div className="menu-divider"></div>
                                <div className="container">
                                    <div
                                        className={`menu-item ${currentSubtitleId === null ? 'selected' : ''}`}
                                        onClick={() => {
                                            handleSubtitleChange('no')
                                            setTimeout(() => setCurrentMenuView('home'), 60)
                                        }}
                                    >
                                        <CheckIcon className="check-icon" />
                                        <div className="text">Disabled</div>
                                    </div>
                                    {subtitleTracks.map(track => (
                                        <div
                                            key={track.id}
                                            className={`menu-item ${currentSubtitleId === track.id ? 'selected' : ''}`}
                                            onClick={() => {
                                                handleSubtitleChange(track.id.toString())
                                                setTimeout(() => setCurrentMenuView('home'), 60)
                                            }}
                                        >
                                            <CheckIcon className="check-icon" />
                                            <div className="text">
                                                {getSubtitleDisplayName(track.id, subtitleTracks, currentTrack)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Speed Submenu */}
                            <div
                                ref={el => {
                                    viewsRef.current.speed = el
                                }}
                                className={`menu-view speed ${currentMenuView === 'speed' ? 'active' : 'hidden'}`}
                            >
                                <div
                                    className="menu-item back-button"
                                    onClick={() => {
                                        setCurrentMenuView('home')
                                    }}
                                >
                                    <ChevronLeftIcon size={16} className="return-icon" />
                                    <div className="text">Speed</div>
                                </div>
                                <div className="menu-divider"></div>
                                <div className="container">
                                    {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(speedValue => (
                                        <div
                                            key={speedValue}
                                            className={`menu-item ${speed === speedValue ? 'selected' : ''}`}
                                            onClick={() => {
                                                handleSpeedChange(speedValue)
                                                setTimeout(() => setCurrentMenuView('home'), 60)
                                            }}
                                        >
                                            <CheckIcon className="check-icon" />
                                            <div className="text">{speedValue === 1 ? 'Normal' : `${speedValue}x`}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Statistics Submenu */}
                            <div
                                ref={el => {
                                    viewsRef.current.statistics = el
                                }}
                                className={`menu-view stats ${currentMenuView === 'statistics' ? 'active' : 'hidden'}`}
                            >
                                <div
                                    className="menu-item back-button"
                                    onClick={() => {
                                        setCurrentMenuView('home')
                                    }}
                                >
                                    <ChevronLeftIcon size={16} className="return-icon" />
                                    <div className="text">Statistics</div>
                                </div>
                                <div className="menu-divider"></div>

                                <div className="container">
                                    {/* Video Section */}
                                    <div className="menu-item stats-header">Video</div>
                                    <div className="menu-item stats-item">
                                        <div className="text">Resolution</div>
                                        <div className="menu-item-value">
                                            {videoWidth > 0 && videoHeight > 0 ? `${videoWidth}x${videoHeight}` : 'N/A'}
                                        </div>
                                    </div>
                                    {/*
                                    <div className="menu-item stats-item">
                                        <div className="text">Codec</div>
                                        <div className="menu-item-value">{formatCodecName(videoCodec)}</div>
                                    </div>
                                    */}
                                    <div className="menu-item stats-item">
                                        <div className="text">Codec</div>
                                        <div className="menu-item-value">{videoFormat.toUpperCase()}</div>
                                    </div>
                                    <div className="menu-item stats-item">
                                        <div className="text">FPS</div>
                                        <div className="menu-item-value">
                                            {fps > 0
                                                ? fps.toFixed(2)
                                                : containerFps > 0
                                                ? containerFps.toFixed(2)
                                                : 'N/A'}
                                        </div>
                                    </div>
                                    <div className="menu-item stats-item">
                                        <div className="text">Size</div>
                                        <div className="menu-item-value">{formatFileSize(fileSize)}</div>
                                    </div>
                                    <div className="menu-item stats-item">
                                        <div className="text">Bitrate</div>
                                        <div className="menu-item-value">{formatBitrate(videoBitrate)}</div>
                                    </div>
                                    {/*
                                    <div className="menu-item stats-item">
                                        <div className="text">Hardware Decoding</div>
                                        <div className="menu-item-value">
                                            {hwdec === 'no' ? 'Disabled' : hwdec === 'N/A' ? 'N/A' : hwdec.toUpperCase()}
                                        </div>
                                    </div>
                                    */}

                                    <div className="menu-divider"></div>

                                    {/* Audio Section */}
                                    <div className="menu-item stats-header">Audio</div>
                                    <div className="menu-item stats-item">
                                        <div className="text">Codec</div>
                                        <div className="menu-item-value">
                                            {formatCodecName(audioCodecName || audioCodec)}
                                        </div>
                                    </div>
                                    <div className="menu-item stats-item">
                                        <div className="text">Channels</div>
                                        <div className="menu-item-value">{getAudioChannelConfig(audioChannels)}</div>
                                    </div>
                                    <div className="menu-item stats-item">
                                        <div className="text">Sample Rate</div>
                                        <div className="menu-item-value">{formatSampleRate(audioSampleRate)}</div>
                                    </div>
                                    <div className="menu-item stats-item">
                                        <div className="text">Bitrate</div>
                                        <div className="menu-item-value">{formatBitrate(audioBitrate)}</div>
                                    </div>
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
                                <MinimizeIcon width={18} height={18} />
                            ) : (
                                <MaximizeIcon width={18} height={18} />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
