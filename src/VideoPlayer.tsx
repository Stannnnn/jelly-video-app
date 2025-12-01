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
import { usePlaybackContext } from './context/PlaybackContext/PlaybackContext'
import './VideoPlayer.css'

function VideoPlayer() {
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

    return (
        <div className={isPaused ? 'video-container' : 'video-container playing'} onMouseMove={handleMouseMove}>
            {!videoLoaded && (
                <div className="no-video-overlay">
                    <div className="no-video-message">Select a video from the media list to start playing</div>
                </div>
            )}

            <div className={`video-header ${showControls || isPaused ? 'visible' : 'hidden'}`}>
                <button className="return" title="Return" onClick={clearCurrentTrack}>
                    <ArrowLeftIcon className="heroicons" />
                </button>
                <div className="video-title">{currentTrack?.Name || 'Unknown Title'} (1956)</div>
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
                            onChange={e => handleSeek(parseFloat(e.target.value))}
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
                        </button>
                        <div className="menu-container">
                            {subtitleTracks.length > 0 && (
                                <div className="menu-item">
                                    <div className="text">Subtitles</div>
                                    <ChevronRightIcon className="heroicons" />
                                    <select
                                        id="subtitle-select"
                                        value={currentSubtitleId?.toString() || 'no'}
                                        onChange={e => handleSubtitleChange(e.target.value)}
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
                                    onChange={e => handleSpeedChange(parseFloat(e.target.value))}
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
