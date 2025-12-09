import { GenresApi } from '@jellyfin/sdk/lib/generated-client'
import {
    CheckCircleFillIcon,
    CheckCircleIcon,
    ChevronDownIcon,
    HeartFillIcon,
    HeartIcon,
    StarFillIcon,
} from '@primer/octicons-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MediaItem } from '../api/jellyfin'
import { useDownloadContext } from '../context/DownloadContext/DownloadContext'
import { useJellyfinServerConfiguration } from '../hooks/Jellyfin/useJellyfinServerConfiguration'
import { useFavorites } from '../hooks/useFavorites'
import { formatDurationReadable } from '../utils/formatDurationReadable'
import { getVideoQuality } from '../utils/getVideoQuality'
import { JellyImg } from './JellyImg'
import './MediaInfo.css'
import { DownloadedIcon, DownloadingIcon, MoreIcon, PlayIcon } from './SvgIcons'

export const MediaInfo = ({ item }: { item: MediaItem }) => {
    const navigate = useNavigate()
    const { addToFavorites, removeFromFavorites } = useFavorites()
    const { addToDownloads, removeFromDownloads } = useDownloadContext()
    const {
        configuration: { minResumePercentage, maxResumePercentage },
    } = useJellyfinServerConfiguration()
    const [isFavorited, setIsFavorited] = useState(item.UserData?.IsFavorite || false)
    const [isTogglingFavorite, setIsTogglingFavorite] = useState(false)

    const toggleFavorite = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (isTogglingFavorite) return

        setIsTogglingFavorite(true)
        const newFavoriteState = !isFavorited

        // Optimistically update UI
        setIsFavorited(newFavoriteState)

        try {
            if (newFavoriteState) {
                await addToFavorites(item)
            } else {
                await removeFromFavorites(item)
            }
        } catch (error) {
            // Revert on error
            setIsFavorited(!newFavoriteState)
            console.error('Failed to toggle favorite:', error)
        } finally {
            setIsTogglingFavorite(false)
        }
    }

    const toggleDownload = async (e: React.MouseEvent) => {
        e.stopPropagation()

        if (!item.offlineState) {
            addToDownloads([item], undefined)
        } else {
            removeFromDownloads([item], undefined)
        }
    }

    const duration = item.RunTimeTicks ? Math.floor(item.RunTimeTicks / 10000000) : null
    //const genres = item.Genres?.join(',') || ''
    const year = item.PremiereDate ? new Date(item.PremiereDate).getFullYear() : null
    const officialRating = item.OfficialRating || ''
    const communityRating = item.CommunityRating ? item.CommunityRating.toFixed(1) : null
    const playedPercentage = item.UserData?.PlayedPercentage || 0
    const hasProgress = playedPercentage > 0 && playedPercentage < 100
    const isPlayed = item.UserData?.Played || false
    const videoQuality = getVideoQuality(item)

    const shouldShowResume = playedPercentage >= minResumePercentage && playedPercentage <= maxResumePercentage

    return (
        <div className="media-info">
            <div className="media-header">
                <div className="backdrop-container noSelect">
                    <div className="backdrop">
                        <JellyImg item={item} type={'Backdrop'} width={1920} height={1080} />
                    </div>
                </div>
                <div className="banner-content">
                    <div className="logo noSelect">
                        <JellyImg
                            item={item}
                            type={'Logo'}
                            width={360}
                            height={120}
                            fallback={<div className="fallback-logo">{item.OriginalTitle}</div>}
                        />
                    </div>
                    <div className="details">
                        <div className="statistics noSelect">
                            {item.RunTimeTicks && (
                                <div className="duration" title="Duration">
                                    {formatDurationReadable(item.RunTimeTicks)}
                                </div>
                            )}
                            {year && (
                                <span className="date" title="Released">
                                    {year}
                                </span>
                            )}
                            {communityRating && (
                                <div className="rating" title="Rating">
                                    <StarFillIcon size={14} /> {communityRating}
                                </div>
                            )}
                            {/*
                            {officialRating && (
                                <span className="rated" title="Official rating">
                                    {officialRating}
                                </span>
                            )}
                            */}
                            {videoQuality && (
                                <div className="quality" title="Quality">
                                    {videoQuality}
                                </div>
                            )}
                            {GenresApi && (
                                <div className="genres" title={item.Genres?.join(', ')}>
                                    {item.Genres?.join(', ')}
                                </div>
                            )}
                        </div>
                        {item.Overview && (
                            <div className="description" title={item.Overview}>
                                {item.Overview}
                            </div>
                        )}
                    </div>
                    {hasProgress && (
                        <div
                            className="progress-indicator"
                            title="Played duration"
                            style={{ '--progress-percent': `${playedPercentage}%` } as React.CSSProperties}
                        />
                    )}
                </div>
            </div>
            <div className="media-actions noSelect">
                <div className="actions">
                    <div className="primary">
                        <div className="play-media">
                            <div className="container" onClick={() => navigate(`/play/${item.Id}`)}>
                                <PlayIcon className="play-icon" width={16} height={16} />
                                <div className="text">{shouldShowResume ? 'Resume' : 'Play'}</div>
                            </div>
                            <div className="version-select" title="Select version">
                                <ChevronDownIcon size={16} />
                            </div>
                        </div>
                        <div className="watch-state icon" title={isPlayed ? 'Mark as watched' : 'Mark as unwatched'}>
                            {isPlayed ? <CheckCircleIcon size={16} /> : <CheckCircleFillIcon size={16} />}
                        </div>
                        <button
                            className={`favorite-state icon ${isFavorited ? 'favorited' : ''}`}
                            onClick={toggleFavorite}
                            disabled={isTogglingFavorite}
                            title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                        >
                            {isFavorited ? <HeartFillIcon size={16} /> : <HeartIcon size={16} />}
                        </button>
                    </div>
                    <div className="secondary">
                        <div
                            className={`download-state ${item.offlineState === 'downloaded' ? 'downloaded' : ''}`}
                            onClick={toggleDownload}
                            title={item.offlineState === 'downloaded' ? 'Remove from downloads' : 'Add to downloads'}
                        >
                            {item.offlineState === 'downloaded' ? (
                                <DownloadedIcon width={20} height={20} />
                            ) : (
                                <DownloadingIcon width={20} height={20} />
                            )}
                        </div>
                        <div className="more" title="More">
                            <MoreIcon width={14} height={14} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
