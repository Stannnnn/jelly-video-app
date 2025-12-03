import { HeartFillIcon, HeartIcon } from '@primer/octicons-react'
import { useState } from 'react'
import { MediaItem } from '../api/jellyfin'
import { useJellyfinContext } from '../context/JellyfinContext/JellyfinContext'
import { usePlaybackContext } from '../context/PlaybackContext/PlaybackContext'
import { usePatchQueries } from '../hooks/usePatchQueries'
import { formatDate } from '../utils/formatDate'
import { formatDurationReadable } from '../utils/formatDurationReadable'
import { JellyImg } from './JellyImg'
import './MediaInfo.css'
import { Squircle } from './Squircle'

export const MediaInfo = ({ item }: { item: MediaItem }) => {
    const api = useJellyfinContext()
    const { playTrack } = usePlaybackContext()
    const { patchMediaItem } = usePatchQueries()
    const [isFavorited, setIsFavorited] = useState(item.UserData?.IsFavorite || false)
    const [isTogglingFavorite, setIsTogglingFavorite] = useState(false)

    const toggleFavorite = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (isTogglingFavorite) return

        setIsTogglingFavorite(true)
        const newFavoriteState = !isFavorited

        // Optimistically update UI
        setIsFavorited(newFavoriteState)
        patchMediaItem(item.Id, item => ({
            ...item,
            UserData: { ...item.UserData, IsFavorite: newFavoriteState },
        }))

        try {
            if (newFavoriteState) {
                await api.addToFavorites(item)
            } else {
                await api.removeFromFavorites(item)
            }
        } catch (error) {
            // Revert on error
            setIsFavorited(!newFavoriteState)
            patchMediaItem(item.Id, item => ({
                ...item,
                UserData: { ...item.UserData, IsFavorite: !newFavoriteState },
            }))
            console.error('Failed to toggle favorite:', error)
        } finally {
            setIsTogglingFavorite(false)
        }
    }

    const duration = item.RunTimeTicks ? Math.floor(item.RunTimeTicks / 10000000) : null
    const genres = item.Genres?.join(', ') || ''
    const year = item.PremiereDate ? new Date(item.PremiereDate).getFullYear() : null
    const officialRating = item.OfficialRating || ''
    const communityRating = item.CommunityRating ? item.CommunityRating.toFixed(1) : null

    return (
        <div className="media-info">
            <div className="media-info-header">
                <div className="media-info-poster">
                    <Squircle width={200} height={300} cornerRadius={12} className="media-portrait">
                        <JellyImg item={item} type={'Primary'} width={200} height={300} />
                    </Squircle>
                </div>
                <div className="media-info-details">
                    <h1 className="media-info-title">{item.Name}</h1>

                    <div className="media-info-metadata">
                        {year && <span className="metadata-item">{year}</span>}
                        {officialRating && <span className="metadata-item rating">{officialRating}</span>}
                        {duration && <span className="metadata-item">{formatDurationReadable(duration)}</span>}
                        {communityRating && <span className="metadata-item">⭐ {communityRating}</span>}
                    </div>

                    {genres && <div className="media-info-genres">{genres}</div>}

                    {item.Overview && <p className="media-info-overview">{item.Overview}</p>}

                    <div className="media-info-actions">
                        <button className="btn btn-primary" onClick={() => playTrack(item)}>
                            Play
                        </button>
                        <button
                            className={`btn btn-icon ${isFavorited ? 'favorited' : ''}`}
                            onClick={toggleFavorite}
                            disabled={isTogglingFavorite}
                            title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                        >
                            {isFavorited ? <HeartFillIcon size={20} /> : <HeartIcon size={20} />}
                        </button>
                    </div>

                    {item.PremiereDate && (
                        <div className="media-info-extra">
                            <span className="extra-label">Release Date:</span> {formatDate(item.PremiereDate)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
