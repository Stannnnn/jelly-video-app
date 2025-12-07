import { GenresApi } from '@jellyfin/sdk/lib/generated-client'
import { HeartFillIcon, HeartIcon } from '@primer/octicons-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MediaItem } from '../api/jellyfin'
import { useFavorites } from '../hooks/useFavorites'
import { formatDurationReadable } from '../utils/formatDurationReadable'
import { JellyImg } from './JellyImg'
import './MediaInfo.css'
import { MoreIcon, PlayIcon } from './SvgIcons'

export const MediaInfo = ({ item }: { item: MediaItem }) => {
    const navigate = useNavigate()
    const { addToFavorites, removeFromFavorites } = useFavorites()
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

    const duration = item.RunTimeTicks ? Math.floor(item.RunTimeTicks / 10000000) : null
    const genres = item.Genres?.join(', ') || ''
    const year = item.PremiereDate ? new Date(item.PremiereDate).getFullYear() : null
    const officialRating = item.OfficialRating || ''
    const communityRating = item.CommunityRating ? item.CommunityRating.toFixed(1) : null

    return (
        <div className="media-info">
            <div className="media-header">
                <div className="backdrop-container">
                    <div className="backdrop">
                        <JellyImg item={item} type={'Backdrop'} width={1920} height={1080} />
                    </div>
                </div>
                <div className="media-content">
                    <div className="logo">{item.Name}</div>
                    <div className="split">
                        <div className="details">
                            <div className="statistics">
                                {item.Overview && <div className="description">{item.Overview}</div>}
                                {year && <span className="metadata-item">{year}</span>}
                                {item.RunTimeTicks && (
                                    <div className="duration">{formatDurationReadable(item.RunTimeTicks)}</div>
                                )}
                                {communityRating && <span className="metadata-item"> {communityRating}</span>}
                                {officialRating && <span className="metadata-item rating">{officialRating}</span>}
                            </div>
                            <div className="media-info-details">
                                {GenresApi && <div className="media-info-genres">{item.Genres}</div>}
                            </div>
                        </div>
                        <div className="actions">
                            <div className="primary">
                                <button className="play-media" onClick={() => navigate(`/play/${item.Id}`)}>
                                    <PlayIcon className="play-icon" width={16} height={16} />
                                    <div className="text">Play</div>
                                </button>
                                <button
                                    className={`favorite-state ${isFavorited ? 'favorited' : ''}`}
                                    onClick={toggleFavorite}
                                    disabled={isTogglingFavorite}
                                    title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                                >
                                    {isFavorited ? <HeartFillIcon size={16} /> : <HeartIcon size={16} />}
                                </button>
                            </div>
                            <div className="secondary">
                                <div className="more" title="More">
                                    <MoreIcon width={14} height={14} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
