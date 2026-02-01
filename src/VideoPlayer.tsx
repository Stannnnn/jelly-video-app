import { BaseItemKind, ItemSortBy, SortOrder } from '@jellyfin/sdk/lib/generated-client'
import { ArrowLeftIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon } from '@primer/octicons-react'
import { useCallback, useEffect, useRef, useState, WheelEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { MediaItem } from './api/jellyfin'
import { Loader } from './components/Loader'
import { NextEpisodeOverlay } from './components/NextEpisodeOverlay'
import { AudioTrack, SubtitleTrack } from './components/PlaybackManager'
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
import { useJellyfinEpisodes } from './hooks/Jellyfin/useJellyfinEpisodes'
import { useJellyfinSequentialNextEpisode } from './hooks/Jellyfin/useJellyfinSequentialNextEpisode'
import { useDisplayTitle } from './hooks/useDisplayTitle'
import { useJellyfinSortedVideoSources } from './hooks/useJellyfinSortedVideoSources'
import { getVideoQuality } from './utils/getVideoQuality'
import './VideoPlayer.css'

type MenuView = 'home' | 'subtitles' | 'audioTracks' | 'videoSources' | 'speed' | 'statistics' | 'episodes'

const getSubtitleDisplayName = (
    subtitleId: number | null,
    subtitleTracks: SubtitleTrack[],
    currentTrack: MediaItem | null | undefined
) => {
    if (subtitleId === null) return 'Disabled'

    const track = subtitleTracks.find(t => t.id === subtitleId)
    if (!track) return 'On'

    if (track.external) {
        return track.title
    }

    const filteredStreams = currentTrack?.MediaStreams?.filter(stream => !stream.IsExternal) || []

    // Use array position since ff-index is the index in this filtered list
    const mediaStream = filteredStreams[track['ff-index']]

    // Use DisplayTitle from MediaStream if available, otherwise fall back to track properties
    return mediaStream?.DisplayTitle || track.title || track.lang || 'On'
}

const getAudioTrackDisplayName = (
    audioTrackId: number | null,
    audioTracks: AudioTrack[],
    currentTrack: MediaItem | null | undefined
) => {
    if (audioTrackId === null) return 'Default'

    const track = audioTracks.find(t => t.id === audioTrackId)
    if (!track) return 'Unknown'

    const filteredStreams = currentTrack?.MediaStreams?.filter(stream => !stream.IsExternal) || []

    // Use array position since ff-index is the index in this filtered list
    const mediaStream = filteredStreams[track['ff-index']]

    // Use DisplayTitle from MediaStream if available, otherwise fall back to track properties
    return mediaStream?.DisplayTitle || track.title || track.lang || 'Unknown'
}

export const VideoPlayer = ({
    isLoading: _isLoading,
    error,
    sourceItem,
}: {
    isLoading: boolean
    error: string | null
    sourceItem: MediaItem | undefined
}) => {
    const api = useJellyfinContext()
    const navigate = useNavigate()
    const {
        isPaused,
        timePos,
        duration,
        isInitialized,
        isPending,
        videoLoaded,
        isBuffering,
        cacheDuration,
        volume,
        speed,
        subtitleTracks,
        currentSubtitleId,
        audioTracks,
        currentAudioTrackId,
        showControls,
        isFullscreen,
        showMenu,
        togglePlayPause,
        currentTrack,
        currentMediaSourceId,
        clearCurrentTrack,
        handleSeek,
        skip,
        formatTime,
        handleVolumeChange,
        toggleMute,
        handleSpeedChange,
        handleSubtitleChange,
        handleAudioTrackChange,
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
        mpvError,
        autoplayNextEpisode,
        showNextEpisodeOverlay,
        nextEpisodeCountdown,
        startNextEpisodeCountdown,
        cancelNextEpisodeCountdown,
    } = usePlaybackContext()

    const isLoading = _isLoading || isPending

    const { goBack: previousPage } = useHistoryContext()

    // Track whether user has manually canceled the countdown for this episode
    const userCanceledCountdownRef = useRef(false)

    // Get next episode (for autoplay - gets sequential next episode regardless of watched state)
    const { nextEpisode } = useJellyfinSequentialNextEpisode(currentTrack || ({} as MediaItem))

    // Get episodes from the current season only
    const { episodes: allEpisodes = [] } = useJellyfinEpisodes(
        currentTrack?.Type === BaseItemKind.Episode ? currentTrack?.SeasonId || null : null,
        [ItemSortBy.ParentIndexNumber, ItemSortBy.IndexNumber],
        [SortOrder.Ascending]
    )

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
    const [showIntroSkip, setShowIntroSkip] = useState(false)
    const [introEndTime, setIntroEndTime] = useState<number | null>(null)

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

    // Reset dimensions on menu close
    useEffect(() => {
        if (showMenu) return

        const container = menuContainerRef.current
        if (!container) return

        container.style.width = ''
        container.style.height = ''
    }, [showMenu])

    // Recalc dimensions if window is resized or maximized
    useEffect(() => {
        if (!showMenu) return

        const activeView = viewsRef.current[currentMenuView]
        if (!activeView) return

        const observer = new ResizeObserver(() => {
            animateMenu()
        })

        observer.observe(activeView)

        return () => {
            observer.disconnect()
        }
    }, [currentMenuView, showMenu, animateMenu])

    // Handle outside click to close menu
    useEffect(() => {
        if (!showMenu) return

        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                // setCurrentMenuView('home')
                // animateMenu()
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
        audioTracks: null,
        videoSources: null,
        speed: null,
        statistics: null,
        episodes: null,
    })

    // Menu animations
    useEffect(() => {
        animateMenu()
    }, [animateMenu, subtitleTracks, audioTracks, videoLoaded, currentTrack])

    // Next Episode Detection - Monitor time position and detect credits or near end
    useEffect(() => {
        if (!currentTrack || !duration || !timePos || !videoLoaded || !autoplayNextEpisode || !nextEpisode) {
            return
        }

        // Check if we're already showing the overlay or if countdown reached 0
        if (showNextEpisodeOverlay) {
            // Auto-navigate when countdown reaches 0
            if (nextEpisodeCountdown === 0 && nextEpisode?.Id) {
                cancelNextEpisodeCountdown()
                navigate(`/play/${nextEpisode.Id}`, { replace: true })
            }
            return
        }

        // Prevent immediate countdown on new episode by checking we're past the first 5 seconds
        // This ensures timePos has properly reset for the new video
        if (timePos < 5) {
            return
        }

        const timeRemaining = duration - timePos

        // Check for credits chapter
        let creditsStartTime: number | null = null
        if (currentTrack.Chapters && currentTrack.Chapters.length > 0) {
            const creditsChapter = currentTrack.Chapters.find(chapter => {
                const name = chapter.Name?.toLowerCase()

                if (!name) return false

                return (
                    name.includes('ending') ||
                    name.includes('outro') ||
                    name.includes('closing') ||
                    name.includes('credit') ||
                    name === 'ed' ||
                    new RegExp('\\bed\\d+\\b').test(name)
                )
            })
            if (creditsChapter && creditsChapter.StartPositionTicks) {
                creditsStartTime = creditsChapter.StartPositionTicks / 10000000 // Convert ticks to seconds
            }
        }

        // Show overlay if:
        // 1. Credits chapter started, OR
        // 2. Less than 30 seconds remaining (fallback for videos without chapters)
        const shouldShowOverlay =
            (creditsStartTime !== null && timePos >= creditsStartTime) ||
            (creditsStartTime === null && timeRemaining <= 30 && timeRemaining > 0)

        // Only start countdown if user hasn't manually canceled it and conditions are met
        if (shouldShowOverlay && !userCanceledCountdownRef.current) {
            startNextEpisodeCountdown()
        }
    }, [
        currentTrack,
        duration,
        timePos,
        videoLoaded,
        autoplayNextEpisode,
        nextEpisode,
        showNextEpisodeOverlay,
        nextEpisodeCountdown,
        startNextEpisodeCountdown,
        navigate,
        cancelNextEpisodeCountdown,
        userCanceledCountdownRef,
    ])

    // Reset cancellation flag when track changes
    useEffect(() => {
        userCanceledCountdownRef.current = false
    }, [currentTrack?.Id])

    // Intro Detection - Monitor time position and detect intro chapter
    useEffect(() => {
        if (!currentTrack || !duration || !timePos || !videoLoaded) {
            setShowIntroSkip(false)
            setIntroEndTime(null)
            return
        }

        // Helper function to check if a chapter is intro-related
        const isIntroChapter = (chapterName: string | undefined | null) => {
            if (!chapterName) return false
            const name = chapterName.toLowerCase()
            return (
                name.includes('intro') ||
                name.includes('opening') ||
                name.includes('op theme') ||
                name.includes('main title') ||
                name.includes('title sequence') ||
                name.includes('prologue') ||
                name.includes('prelude') ||
                name.includes('recap') ||
                name.includes('previously') ||
                name.includes('review') ||
                name.includes('preview') ||
                name.includes('summary') ||
                name.includes('last time') ||
                name.includes('flashback') ||
                name === 'op' ||
                new RegExp('\\bop\\d+\\b').test(name)
            )
        }

        // Check for intro chapter
        if (currentTrack.Chapters && currentTrack.Chapters.length > 0) {
            const introChapterIndex = currentTrack.Chapters.findIndex(chapter => isIntroChapter(chapter.Name))

            if (introChapterIndex !== -1) {
                const introChapter = currentTrack.Chapters[introChapterIndex]
                const introStartTime = (introChapter.StartPositionTicks || 0) / 10000000 // Convert ticks to seconds

                // Find all consecutive intro chapters (allowing gaps of up to 5 seconds)
                let lastIntroIndex = introChapterIndex
                for (let i = introChapterIndex + 1; i < currentTrack.Chapters.length; i++) {
                    if (isIntroChapter(currentTrack.Chapters[i].Name)) {
                        lastIntroIndex = i
                    } else {
                        // Check if this non-intro chapter is short (< 5 seconds)
                        const currentChapterStart = (currentTrack.Chapters[i].StartPositionTicks || 0) / 10000000
                        const currentChapterEnd = i + 1 < currentTrack.Chapters.length
                            ? (currentTrack.Chapters[i + 1].StartPositionTicks || 0) / 10000000
                            : 0
                        
                        const chapterDuration = currentChapterEnd > 0 ? currentChapterEnd - currentChapterStart : Infinity
                        
                        // If this chapter is less than 5 seconds and there's a following intro chapter, skip over it
                        if (chapterDuration < 5 && i + 1 < currentTrack.Chapters.length && isIntroChapter(currentTrack.Chapters[i + 1].Name)) {
                            // Continue to check the next chapter (which we know is an intro)
                            continue
                        } else {
                            // This gap is too long or there's no intro after it
                            break
                        }
                    }
                }

                // Get the end time of the last consecutive intro chapter
                const introEndTimeCalc =
                    lastIntroIndex + 1 < currentTrack.Chapters.length
                        ? (currentTrack.Chapters[lastIntroIndex + 1].StartPositionTicks || 0) / 10000000
                        : 0

                // Show skip button if we're within any of the consecutive intro chapters
                if (introStartTime && introEndTimeCalc && timePos >= introStartTime && timePos < introEndTimeCalc) {
                    setShowIntroSkip(true)
                    setIntroEndTime(introEndTimeCalc)
                } else {
                    setShowIntroSkip(false)
                    setIntroEndTime(null)
                }
            } else {
                setShowIntroSkip(false)
                setIntroEndTime(null)
            }
        } else {
            setShowIntroSkip(false)
            setIntroEndTime(null)
        }
    }, [currentTrack, duration, timePos, videoLoaded])

    // If video ends naturally (timePos reaches duration), immediately go to next episode
    useEffect(() => {
        if (!currentTrack || !duration || !timePos || !videoLoaded || !autoplayNextEpisode || !nextEpisode) {
            return
        }

        // If we're within 1 second of the end, navigate immediately
        if (duration - timePos < 1 && duration - timePos > 0 && nextEpisode.Id) {
            cancelNextEpisodeCountdown()
            navigate(`/play/${nextEpisode.Id}`, { replace: true })
        }
    }, [
        currentTrack,
        duration,
        timePos,
        videoLoaded,
        autoplayNextEpisode,
        nextEpisode,
        navigate,
        cancelNextEpisodeCountdown,
    ])

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

        // Clamp preview within progress bar bounds
        const PREVIEW_HALF_WIDTH = 100
        const clampedOffsetX = Math.max(PREVIEW_HALF_WIDTH, Math.min(rect.width - PREVIEW_HALF_WIDTH, offsetX))

        setPreviewPosition((clampedOffsetX / rect.width) * 100)

        // Old percentage clamp
        // const clampedPercentage = Math.max(10, Math.min(90, percentage * 100))
        // setPreviewPosition(clampedPercentage)

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

    const displayTitle = useDisplayTitle(currentTrack)

    // Handler to skip intro
    const handleSkipIntro = () => {
        if (introEndTime !== null) {
            handleSeek(introEndTime)
            setShowIntroSkip(false)
            setIntroEndTime(null)
        }
    }

    const { sortedVideoSources } = useJellyfinSortedVideoSources(sourceItem)

    return (
        <div
            className={`video-container noSelect ${isPaused ? '' : 'playing'} ${isFullscreen ? 'fullscreen' : ''}`}
            onMouseMove={handleMouseMove}
            onDoubleClick={toggleFullscreen}
        >
            <div
                className={`video-header ${shouldShowControls ? 'visible' : 'hidden'}`}
                onMouseEnter={() => setIsHoveringControls(true)}
                onMouseLeave={() => setIsHoveringControls(false)}
                onDoubleClick={e => e.stopPropagation()}
            >
                <button className="return" title="Return" onClick={previousPage}>
                    <ArrowLeftIcon size={20} className="return-icon" />
                </button>
                <div className="video-title">
                    {currentTrack?.Type === 'Episode' && currentTrack?.SeriesName ? (
                        <div className="container">
                            <div className="series">{currentTrack.SeriesName}</div>
                            <div className="episode">{displayTitle}</div>
                        </div>
                    ) : (
                        <>{displayTitle}</>
                    )}
                </div>
            </div>

            <div className="video-overlay">
                <div className="container">
                    {!isLoading && currentTrack && !isBuffering && (
                        <div className="video-play-icon" onClick={handleContainerClick}>
                            <VideoPlayIcon width={42} height={42} />
                        </div>
                    )}
                    {(isLoading || !currentTrack || isBuffering) && <Loader />}
                    {!isLoading && (error || mpvError || !videoLoaded) && (
                        <div className="error-overlay">{error || mpvError || 'Video not loaded'}</div>
                    )}
                </div>
            </div>

            <div
                className={`video-controls ${shouldShowControls ? 'visible' : 'hidden'}`}
                onMouseEnter={() => setIsHoveringControls(true)}
                onMouseLeave={() => setIsHoveringControls(false)}
                onDoubleClick={e => e.stopPropagation()}
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
                            <div className="quality-label">
                                {getVideoQuality(currentTrack, true, currentMediaSourceId)}
                            </div>
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

                                {sortedVideoSources.length > 1 && (
                                    <div
                                        className="menu-item"
                                        onClick={() => {
                                            setCurrentMenuView('videoSources')
                                        }}
                                    >
                                        <div className="text">Version</div>
                                        <div className="menu-item-right">
                                            <div className="menu-item-value">
                                                {sortedVideoSources.find(s => s.Id === currentMediaSourceId)?.Name ||
                                                    getVideoQuality(currentTrack, true, currentMediaSourceId)}
                                            </div>
                                            <ChevronRightIcon size={16} className="icon" />
                                        </div>
                                    </div>
                                )}

                                {audioTracks.length > 1 && (
                                    <div
                                        className="menu-item"
                                        onClick={() => {
                                            setCurrentMenuView('audioTracks')
                                        }}
                                    >
                                        <div className="text">Audio</div>
                                        <div className="menu-item-right">
                                            <div className="menu-item-value">
                                                {getAudioTrackDisplayName(
                                                    currentAudioTrackId,
                                                    audioTracks,
                                                    currentTrack
                                                )}
                                            </div>
                                            <ChevronRightIcon size={16} className="icon" />
                                        </div>
                                    </div>
                                )}

                                {allEpisodes.length > 0 && (
                                    <div
                                        className="menu-item"
                                        onClick={() => {
                                            setCurrentMenuView('episodes')
                                        }}
                                    >
                                        <div className="text">Episodes</div>
                                        <div className="menu-item-right">
                                            <div className="menu-item-value">
                                                {`S${String(currentTrack?.ParentIndexNumber || 0).padStart(2, '0')} E${String(currentTrack?.IndexNumber || 0).padStart(2, '0')} - ${currentTrack?.Name || 'Untitled'}`}
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

                            {/* Video Sources Submenu */}
                            <div
                                ref={el => {
                                    viewsRef.current.videoSources = el
                                }}
                                className={`menu-view versions ${currentMenuView === 'videoSources' ? 'active' : 'hidden'}`}
                            >
                                <div
                                    className="menu-item back-button"
                                    onClick={() => {
                                        setCurrentMenuView('home')
                                    }}
                                >
                                    <ChevronLeftIcon size={16} className="return-icon" />
                                    <div className="text">Version</div>
                                </div>
                                <div className="menu-divider"></div>
                                <div className="container">
                                    {sortedVideoSources.map((source, index) => {
                                        const videoStream = source.MediaStreams?.find(s => s.Type === 'Video')
                                        const baseName =
                                            source.Name || videoStream?.DisplayTitle || `Version ${index + 1}`

                                        const bitrate = source.Bitrate || videoStream?.BitRate
                                        const bitrateMbps = bitrate ? (bitrate / 1_000_000).toFixed(1) : null

                                        let qualityBadge = getVideoQuality(sourceItem, false, source.Id || undefined)

                                        if (videoStream?.VideoRange === 'HDR' && qualityBadge) {
                                            qualityBadge = `${qualityBadge} HDR`
                                        }

                                        const details = [bitrateMbps ? `${bitrateMbps} Mbps` : null, qualityBadge]
                                            .filter(Boolean)
                                            .join(', ')

                                        const displayName = details ? `${baseName} (${details})` : baseName

                                        return (
                                            <div
                                                key={source.Id || index}
                                                className={`menu-item ${
                                                    currentMediaSourceId === source.Id ? 'selected' : ''
                                                }`}
                                                onClick={() => {
                                                    if (source.Id) {
                                                        navigate(`/play/${sourceItem?.Id}/${source.Id}`, {
                                                            replace: true,
                                                        })
                                                        toggleMenu()
                                                    }
                                                }}
                                            >
                                                <CheckIcon className="check-icon" />
                                                <div className="text">{displayName}</div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Audio Tracks Submenu */}
                            <div
                                ref={el => {
                                    viewsRef.current.audioTracks = el
                                }}
                                className={`menu-view audio ${currentMenuView === 'audioTracks' ? 'active' : 'hidden'}`}
                            >
                                <div
                                    className="menu-item back-button"
                                    onClick={() => {
                                        setCurrentMenuView('home')
                                    }}
                                >
                                    <ChevronLeftIcon size={16} className="return-icon" />
                                    <div className="text">Audio</div>
                                </div>
                                <div className="menu-divider"></div>
                                <div className="container">
                                    {audioTracks.map(track => (
                                        <div
                                            key={track.id}
                                            className={`menu-item ${
                                                currentAudioTrackId === track.id ? 'selected' : ''
                                            }`}
                                            onClick={() => {
                                                handleAudioTrackChange(track.id.toString())
                                                setTimeout(() => setCurrentMenuView('home'), 60)
                                            }}
                                        >
                                            <CheckIcon className="check-icon" />
                                            <div className="text">
                                                {getAudioTrackDisplayName(track.id, audioTracks, currentTrack)}
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

                            {/* Episodes Submenu */}
                            <div
                                ref={el => {
                                    viewsRef.current.episodes = el
                                }}
                                className={`menu-view episodes ${currentMenuView === 'episodes' ? 'active' : 'hidden'}`}
                            >
                                <div
                                    className="menu-item back-button"
                                    onClick={() => {
                                        setCurrentMenuView('home')
                                    }}
                                >
                                    <ChevronLeftIcon size={16} className="return-icon" />
                                    <div className="text">Episodes</div>
                                </div>
                                <div className="menu-divider"></div>
                                <div className="container">
                                    {allEpisodes.map((episode, index) => {
                                        const isCurrentEpisode = episode.Id === currentTrack?.Id
                                        const season = String(episode.ParentIndexNumber || 0).padStart(2, '0')
                                        const episodeNum = String(episode.IndexNumber ?? index + 1).padStart(2, '0')
                                        const episodeName = episode.Name || 'Untitled'

                                        return (
                                            <div
                                                key={episode.Id}
                                                className={`menu-item ${isCurrentEpisode ? 'selected' : ''}`}
                                                onClick={async () => {
                                                    if (!isCurrentEpisode) {
                                                        navigate(`/play/${episode.Id}`, { replace: true })
                                                        toggleMenu()
                                                    }
                                                }}
                                            >
                                                <CheckIcon className="check-icon" />
                                                <div className="text">
                                                    S{season} E{episodeNum} - {episodeName}
                                                </div>
                                                {isCurrentEpisode && <div className="menu-item-right"></div>}
                                            </div>
                                        )
                                    })}
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

            <NextEpisodeOverlay
                nextEpisode={nextEpisode}
                countdown={nextEpisodeCountdown}
                onPlayNow={() => {
                    cancelNextEpisodeCountdown()
                    navigate(`/play/${nextEpisode?.Id}`, { replace: true })
                }}
                onCancel={() => {
                    userCanceledCountdownRef.current = true
                    cancelNextEpisodeCountdown()
                }}
                isVisible={!!(showNextEpisodeOverlay && nextEpisode)}
            />

            <div className={`intro-skip-overlay ${showIntroSkip ? 'visible' : ''}`}>
                <button className="intro-skip-button" onClick={handleSkipIntro}>
                    Skip Intro
                </button>
            </div>
        </div>
    )
}
