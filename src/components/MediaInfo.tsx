import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client'
import {
    CheckCircleFillIcon,
    CheckCircleIcon,
    ChevronDownIcon,
    ChevronLeftIcon,
    HeartFillIcon,
    HeartIcon,
    StarFillIcon,
} from '@primer/octicons-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MediaItem } from '../api/jellyfin'
import { useDownloadContext } from '../context/DownloadContext/DownloadContext'
import { useJellyfinCollections } from '../hooks/Jellyfin/useJellyfinCollections'
import { useJellyfinNextEpisode } from '../hooks/Jellyfin/useJellyfinNextEpisode'
import { useJellyfinServerConfiguration } from '../hooks/Jellyfin/useJellyfinServerConfiguration'
import { useCollections } from '../hooks/useCollections'
import { useDisplayTitle } from '../hooks/useDisplayTitle'
import { useFavorites } from '../hooks/useFavorites'
import { useWatchedState } from '../hooks/useWatchedState'
import { formatDurationReadable } from '../utils/formatDurationReadable'
import { getVideoQuality } from '../utils/getVideoQuality'
import { InlineLoader } from './InlineLoader'
import { JellyImg } from './JellyImg'
import './MediaInfo.css'
import { DownloadedIcon, DownloadingIcon, MoreIcon, PlayIcon } from './SvgIcons'

export const MediaInfo = ({ item }: { item: MediaItem }) => {
    const navigate = useNavigate()
    const { addToFavorites, removeFromFavorites } = useFavorites()
    const { markAsPlayed, markAsUnplayed } = useWatchedState()
    const { addToDownloads, removeFromDownloads } = useDownloadContext()
    const { addToCollection, createCollection } = useCollections()
    const { collections, isLoading: isLoadingCollections } = useJellyfinCollections()
    const { nextEpisode, isLoading: isLoadingNextEpisode } = useJellyfinNextEpisode(item)
    const {
        configuration: { minResumePercentage, maxResumePercentage },
    } = useJellyfinServerConfiguration()
    const [isFavorited, setIsFavorited] = useState(item.UserData?.IsFavorite || false)
    const [isTogglingFavorite, setIsTogglingFavorite] = useState(false)
    const [isPlayed, setIsPlayed] = useState(item.UserData?.Played || false)
    const [isTogglingWatched, setIsTogglingWatched] = useState(false)
    const [isMoreDropdownOpen, setIsMoreDropdownOpen] = useState(false)
    const [isCollectionDropdownOpen, setIsCollectionDropdownOpen] = useState(false)
    const [collectionName, setCollectionName] = useState('')
    const [isCreatingCollection, setIsCreatingCollection] = useState(false)
    const [isVersionDropdownOpen, setIsVersionDropdownOpen] = useState(false)
    const moreButtonRef = useRef<HTMLDivElement>(null)
    const versionButtonRef = useRef<HTMLDivElement>(null)

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

    const toggleWatched = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (isTogglingWatched) return

        setIsTogglingWatched(true)
        const newWatchedState = !isPlayed

        // Optimistically update UI
        setIsPlayed(newWatchedState)

        try {
            if (newWatchedState) {
                await markAsPlayed(item)
            } else {
                await markAsUnplayed(item)
            }
        } catch (error) {
            // Revert on error
            setIsPlayed(!newWatchedState)
            console.error('Failed to toggle watched state:', error)
        } finally {
            setIsTogglingWatched(false)
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

    const handlePlayClick = (mediaSourceId?: string) => {
        const itemId = nextEpisode?.episodeId || item.Id
        if (mediaSourceId !== undefined) {
            navigate(`/play/${itemId}/${mediaSourceId}`)
        } else {
            navigate(`/play/${itemId}`)
        }
    }

    const toggleVersionDropdown = (e: React.MouseEvent) => {
        e.stopPropagation()
        setIsVersionDropdownOpen(!isVersionDropdownOpen)
    }

    const toggleMoreDropdown = (e: React.MouseEvent) => {
        e.stopPropagation()
        setIsMoreDropdownOpen(!isMoreDropdownOpen)
    }

    const handleAddToCollection = (e: React.MouseEvent) => {
        e.stopPropagation()
        setIsCollectionDropdownOpen(!isCollectionDropdownOpen)
    }

    const handleCollectionNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCollectionName(e.target.value)
    }

    const handleCollectionInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && collectionName.trim()) {
            handleCreateCollection()
        }
    }

    const handleCreateCollection = async () => {
        if (!collectionName.trim() || isCreatingCollection) return

        setIsCreatingCollection(true)
        try {
            const newCollection = await createCollection(collectionName.trim())
            await addToCollection(item, newCollection.Id)
            setCollectionName('')
            setIsCollectionDropdownOpen(false)
            setIsMoreDropdownOpen(false)
        } catch (error) {
            console.error('Failed to create collection:', error)
        } finally {
            setIsCreatingCollection(false)
        }
    }

    const handleSelectCollection = async (collectionId: string) => {
        try {
            await addToCollection(item, collectionId)
            setIsCollectionDropdownOpen(false)
            setIsMoreDropdownOpen(false)
        } catch (error) {
            console.error('Failed to add to collection:', error)
        }
    }

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (moreButtonRef.current && !moreButtonRef.current.contains(event.target as Node)) {
                setIsCollectionDropdownOpen(false)
                setIsMoreDropdownOpen(false)
            }
            if (versionButtonRef.current && !versionButtonRef.current.contains(event.target as Node)) {
                setIsVersionDropdownOpen(false)
            }
        }

        if (isMoreDropdownOpen || isVersionDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isMoreDropdownOpen, isVersionDropdownOpen])

    //const genres = item.Genres?.join(',') || ''
    const year = item.PremiereDate ? new Date(item.PremiereDate).getFullYear() : null
    const endyear = item.EndDate ? new Date(item.EndDate).getFullYear() : null
    //const officialRating = item.OfficialRating || ''
    const communityRating = item.CommunityRating ? item.CommunityRating.toFixed(1) : null
    const playedPercentage = item.UserData?.PlayedPercentage || 0
    const hasProgressbar = item.UserData?.Played || (playedPercentage > 0 && playedPercentage < 100)
    const progressbarPercentage = item.UserData?.Played ? 100 : playedPercentage
    const videoQuality = getVideoQuality(item)

    const shouldShowResume = playedPercentage >= minResumePercentage && playedPercentage <= maxResumePercentage

    const displayTitle = useDisplayTitle(item)
    const runTimeTicks = item.RunTimeTicks || 0
    const videoSources = item.MediaSources || []

    const sortedVideoSources = [...videoSources].sort((a, b) => {
        const heightA = a.MediaStreams?.find(s => s.Type === 'Video')?.Height || 0
        const heightB = b.MediaStreams?.find(s => s.Type === 'Video')?.Height || 0
        return heightB - heightA
    })

    const defaultMediaSourceId = sortedVideoSources[0]?.Id ?? undefined

    return (
        <div className="media-info">
            <div className="media-header">
                <div className="backdrop-container noSelect">
                    <div className="backdrop">
                        <JellyImg item={item} type={'Backdrop'} width={1920} height={1080} />
                    </div>
                </div>
                <div className="banner-content">
                    <div
                        className={`logo noSelect ${item.Type === BaseItemKind.Episode && item.SeriesId ? 'link' : ''}`}
                        onClick={() => {
                            if (item.Type === BaseItemKind.Episode && item.SeriesId) {
                                navigate(`/series/${item.SeriesId}`)
                            }
                        }}
                    >
                        <JellyImg
                            item={item}
                            type={'Logo'}
                            width={360}
                            height={120}
                            fallback={
                                <div className="fallback-logo" title={displayTitle}>
                                    {displayTitle}
                                </div>
                            }
                        />
                    </div>
                    <div className="details">
                        <div className="statistics noSelect">
                            {runTimeTicks > 0 && item.Type !== BaseItemKind.Series && (
                                <div className="duration" title="Duration">
                                    {formatDurationReadable(runTimeTicks)}
                                </div>
                            )}
                            {year && (
                                <div className="date">
                                    <div className="premiere" title="Released">
                                        {year}
                                    </div>
                                    {endyear && endyear !== year && (
                                        <>
                                            <div className="divider">-</div>
                                            <div className="enddate" title="Ended">
                                                {endyear}
                                            </div>
                                        </>
                                    )}
                                </div>
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
                            {item.Genres && item.Genres.length > 0 && (
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
                    {hasProgressbar && (
                        <div
                            className="progress-indicator"
                            title="Played duration"
                            style={{ '--progress-percent': `${progressbarPercentage}%` } as React.CSSProperties}
                        />
                    )}
                </div>
            </div>
            <div className="media-actions noSelect">
                <div className="actions">
                    <div className="primary">
                        {!isLoadingNextEpisode && (
                            <div className="play-media">
                                <div className="container" onClick={() => handlePlayClick(defaultMediaSourceId)}>
                                    <PlayIcon className="play-icon" width={16} height={16} />
                                    <div className="text">
                                        {item.Type === BaseItemKind.Series && nextEpisode && shouldShowResume
                                            ? `Resume S${String(nextEpisode.seasonNumber || 0).padStart(
                                                  2,
                                                  '0'
                                              )} E${String(nextEpisode.episodeNumber || 0).padStart(2, '0')}`
                                            : item.Type === BaseItemKind.Series && nextEpisode
                                            ? `Play S${String(nextEpisode.seasonNumber || 0).padStart(
                                                  2,
                                                  '0'
                                              )} E${String(nextEpisode.episodeNumber || 0).padStart(2, '0')}`
                                            : shouldShowResume
                                            ? 'Resume'
                                            : 'Play'}
                                    </div>
                                </div>
                                {videoSources.length > 1 && (
                                    <div className="version-container" ref={versionButtonRef}>
                                        <div
                                            className={`version-select ${isVersionDropdownOpen ? 'active' : ''}`}
                                            onClick={toggleVersionDropdown}
                                            title="Select version"
                                        >
                                            <ChevronDownIcon size={16} />
                                        </div>
                                        <div className={`version-dropdown ${isVersionDropdownOpen ? 'open' : ''}`}>
                                            {sortedVideoSources.map((source, index) => {
                                                const videoStream = source.MediaStreams?.find(s => s.Type === 'Video')
                                                const baseName =
                                                    source.Name || videoStream?.DisplayTitle || `Version ${index + 1}`

                                                const bitrate = source.Bitrate || videoStream?.BitRate
                                                const bitrateMbps = bitrate ? (bitrate / 1_000_000).toFixed(1) : null

                                                let qualityBadge = getVideoQuality(item, false, source.Id || undefined)

                                                if (videoStream?.VideoRange === 'HDR' && qualityBadge) {
                                                    qualityBadge = `${qualityBadge} HDR`
                                                }

                                                const details = [
                                                    bitrateMbps ? `${bitrateMbps} Mbps` : null,
                                                    qualityBadge,
                                                ]
                                                    .filter(Boolean)
                                                    .join(', ')

                                                const displayName = details ? `${baseName} (${details})` : baseName

                                                return (
                                                    <div
                                                        key={source.Id || index}
                                                        className="version-dropdown-item"
                                                        onClick={() => {
                                                            handlePlayClick(source.Id || undefined)
                                                            setIsVersionDropdownOpen(false)
                                                        }}
                                                    >
                                                        {displayName}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        <div
                            className={isPlayed ? 'watch-state icon watched' : 'watch-state icon'}
                            onClick={toggleWatched}
                            title={isPlayed ? 'Mark as unwatched' : 'Mark as watched'}
                        >
                            {isPlayed ? <CheckCircleFillIcon size={16} /> : <CheckCircleIcon size={16} />}
                        </div>
                        <div
                            className={`favorite-state icon ${isFavorited ? 'favorited' : ''}`}
                            onClick={toggleFavorite}
                            title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                        >
                            {isFavorited ? <HeartFillIcon size={16} /> : <HeartIcon size={16} />}
                        </div>
                    </div>
                    <div className="secondary">
                        {item.offlineState &&
                            (item.offlineState === 'downloaded' || item.offlineState === 'downloading') && (
                                <div
                                    className={`download-state ${
                                        item.offlineState === 'downloaded' ? 'downloaded' : 'downloading'
                                    }`}
                                    title={item.offlineState === 'downloaded' ? 'Remove from downloads' : 'Downloading'}
                                >
                                    {item.offlineState === 'downloaded' ? (
                                        <DownloadedIcon width={18} height={18} />
                                    ) : (
                                        <DownloadingIcon width={18} height={18} />
                                    )}
                                </div>
                            )}
                        <div className="more-container" ref={moreButtonRef}>
                            <div
                                className={`more ${isMoreDropdownOpen ? 'active' : ''}`}
                                onClick={toggleMoreDropdown}
                                title="More"
                            >
                                <MoreIcon width={14} height={14} />
                            </div>
                            <div className={`more-dropdown ${isMoreDropdownOpen ? 'open' : ''}`}>
                                <div className="more-dropdown-item" onClick={toggleDownload}>
                                    <div className="text">
                                        {item.offlineState === 'downloaded' ? 'Remove download' : 'Download'}
                                    </div>
                                </div>
                                <div className="dropdown-separator" />
                                <div className="more-dropdown-item" onClick={handleAddToCollection}>
                                    <div className="text">Add to collection</div>
                                    <div className="icon">
                                        <ChevronLeftIcon size={14} />
                                    </div>
                                    <div
                                        className={`sub-dropdown ${isCollectionDropdownOpen ? 'open' : ''}`}
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <div className="input-container">
                                            <input
                                                value={collectionName}
                                                onChange={handleCollectionNameChange}
                                                onKeyDown={handleCollectionInputKeyDown}
                                                onClick={e => e.stopPropagation()}
                                                placeholder="New collection..."
                                                className={`input${collectionName.trim() ? ' has-text' : ''}`}
                                                disabled={isCreatingCollection}
                                            />
                                            {isCreatingCollection && (
                                                <div className="loading">
                                                    <InlineLoader />
                                                </div>
                                            )}
                                            {!isCreatingCollection && collectionName.trim() && (
                                                <button className="create-btn" onClick={handleCreateCollection}>
                                                    Create
                                                </button>
                                            )}
                                        </div>
                                        {collections.length > 0 && <div className="dropdown-separator" />}

                                        <div className="dropdown-content" onClick={e => e.stopPropagation()}>
                                            {isLoadingCollections && collections.length === 0 && (
                                                <div className="loading">
                                                    <InlineLoader />
                                                </div>
                                            )}
                                            {collections.map(collection => (
                                                <div
                                                    key={collection.Id}
                                                    className="dropdown-item"
                                                    onClick={() => handleSelectCollection(collection.Id)}
                                                >
                                                    {collection.Name}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
