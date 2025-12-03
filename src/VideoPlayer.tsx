import {
    Cog8ToothIcon,
    PauseIcon,
    PlayCircleIcon,
    PlayIcon,
    SpeakerWaveIcon,
    SpeakerXMarkIcon,
} from '@heroicons/react/20/solid'
import {
    ArrowLeftIcon,
    CheckIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    MaximizeIcon,
    MinimizeIcon,
} from '@primer/octicons-react'
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
        <div
            className={isPaused ? 'video-container noSelect' : 'video-container noSelect playing'}
            onMouseMove={handleMouseMove}
        >
            <div
                className={`video-header ${shouldShowControls ? 'visible' : 'hidden'}`}
                onMouseEnter={() => setIsHoveringControls(true)}
                onMouseLeave={() => setIsHoveringControls(false)}
            >
                <button className="return" title="Return" onClick={clearCurrentTrack}>
                    <ArrowLeftIcon size={20} className="return-icon" />
                </button>
                <div className="video-title">
                    {currentTrack?.Name || 'Unknown Title'}
                    {currentTrack?.PremiereDate && ` (${new Date(currentTrack.PremiereDate).getFullYear()})`}
                </div>
            </div>

            <div className="video-play-icon" onClick={handleContainerClick}>
                <PlayCircleIcon className="heroicons" />
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
                            <div className="quality-label">{getQualityLabel()}</div>
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
                                            <div className="menu-item-value">
                                                {currentSubtitleId === null
                                                    ? 'Disabled'
                                                    : subtitleTracks.find(t => t.id === currentSubtitleId)?.title ||
                                                      subtitleTracks.find(t => t.id === currentSubtitleId)?.lang ||
                                                      'On'}
                                            </div>
                                            <ChevronRightIcon size={16} className="icon" />
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
                                        <div className="menu-item-value">{speed === 1 ? 'Normal' : `${speed}x`}</div>
                                        <ChevronRightIcon size={16} className="icon" />
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
                                    <div className="menu-item-right">
                                        <ChevronRightIcon size={16} className="icon" />
                                    </div>
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
                                    <ChevronLeftIcon size={16} className="return-icon" />
                                    <div className="text">Subtitles</div>
                                </div>
                                <div className="menu-divider"></div>
                                <div className="container">
                                    <div
                                        className={`menu-item ${currentSubtitleId === null ? 'selected' : ''}`}
                                        onClick={() => handleSubtitleChange('no')}
                                    >
                                        <CheckIcon className="heroicons check-icon" />
                                        <div className="text">Disabled</div>
                                    </div>
                                    {subtitleTracks.map(track => (
                                        <div
                                            key={track.id}
                                            className={`menu-item ${currentSubtitleId === track.id ? 'selected' : ''}`}
                                            onClick={() => handleSubtitleChange(track.id.toString())}
                                        >
                                            <CheckIcon className="heroicons check-icon" />
                                            <div className="text">
                                                {track.title || track.lang || `Track ${track.id}`}
                                            </div>
                                        </div>
                                    ))}
                                </div>
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
                                    <ChevronLeftIcon size={16} className="return-icon" />
                                    <div className="text">Speed</div>
                                </div>
                                <div className="menu-divider"></div>
                                <div className="container">
                                    {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(speedValue => (
                                        <div
                                            key={speedValue}
                                            className={`menu-item ${speed === speedValue ? 'selected' : ''}`}
                                            onClick={() => handleSpeedChange(speedValue)}
                                        >
                                            <CheckIcon className="heroicons check-icon" />
                                            <div className="text">{speedValue}x</div>
                                        </div>
                                    ))}
                                </div>
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
                            {isFullscreen ? <MinimizeIcon size={16} /> : <MaximizeIcon size={16} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
