import { HeartFillIcon } from '@primer/octicons-react'
import { ReactNode } from 'react'
import { MediaItem } from '../api/jellyfin'
import { usePlaybackContext } from '../context/PlaybackContext/PlaybackContext'
import { useDisplayItems } from '../hooks/useDisplayItems'
import { JellyImg } from './JellyImg'
import { Loader } from './Loader'
import { Skeleton } from './Skeleton'
import { Squircle } from './Squircle'
import { PlaystateAnimationMedalist } from './SvgIcons'
import { VirtuosoWindow } from './VirtuosoWindow'

export const MediaList = ({
    items = [],
    isLoading,
    type,
    loadMore,
    disableActions = false,
    removeButton,
    className,
}: {
    items: MediaItem[] | undefined
    isLoading: boolean
    type: 'song' | 'album' | 'artist' | 'playlist' | 'genre'
    loadMore?: () => void
    disableActions?: boolean
    removeButton?: (item: MediaItem) => ReactNode
    className?: string
}) => {
    const { displayItems, setRowRefs } = useDisplayItems(items, isLoading)
    const { playTrack } = usePlaybackContext()

    const renderItem = (index: number, item: MediaItem | { isPlaceholder: true } | undefined) => {
        if (!item || 'isPlaceholder' in item) {
            return (
                <div className={`media-item song-item ${className || ''}`} ref={el => setRowRefs(index, el)}>
                    <Skeleton type="song" />
                </div>
            )
        }

        return (
            <div
                className={`media-item song-item ${className || ''}`}
                ref={el => setRowRefs(index, el)}
                onClick={() => playTrack(item)}
                style={{ cursor: 'pointer' }}
            >
                <Squircle width={46} height={46} cornerRadius={6} className="media-state">
                    <JellyImg item={item} type={'Primary'} width={46} height={46} />

                    <div className="overlay">
                        <div className="container">
                            <div className="play">
                                <div className="play-icon"></div>
                            </div>
                            <div className="pause">
                                <div className="pause-icon"></div>
                            </div>
                        </div>
                        <div className="play-state-animation">
                            <PlaystateAnimationMedalist width={28} height={20} className="sound-bars" />
                        </div>
                    </div>
                </Squircle>
                <div className="media-details">
                    <span className="song-name">{item.Name}</span>
                    <div className="container">
                        <div className="artist">
                            {item.Artists && item.Artists.length > 0 ? item.Artists.join(', ') : 'Unknown Artist'}
                        </div>
                        <div className="divider"></div>
                        <div className="album">{item.Album || 'Unknown Album'}</div>
                    </div>
                </div>

                <MediaIndicators item={item} disableActions={disableActions} removeButton={removeButton} />
            </div>
        )
    }

    if (isLoading && items.length === 0) {
        return <Loader />
    }

    if (items.length === 0 && !isLoading) {
        return (
            <div className="empty">
                {type === 'song'
                    ? 'No tracks were found'
                    : type === 'album'
                    ? 'No albums were found'
                    : type === 'artist'
                    ? 'No artists were found'
                    : type === 'playlist'
                    ? 'No playlists were found'
                    : 'No genres were found'}
            </div>
        )
    }

    return (
        <ul className="media-list noSelect">
            <VirtuosoWindow data={displayItems} itemContent={renderItem} endReached={loadMore} overscan={800} />
        </ul>
    )
}

const MediaIndicators = ({
    item,
    disableActions,
    removeButton,
}: {
    item: MediaItem
    disableActions: boolean
    removeButton?: (item: MediaItem) => ReactNode
}) => {
    return (
        <div className="media-indicators">
            {removeButton && removeButton(item)}

            {!disableActions && item.UserData?.IsFavorite && location.pathname !== '/favorites' && (
                <div className="favorited" title="Favorited">
                    <HeartFillIcon size={16} />
                </div>
            )}
        </div>
    )
}
