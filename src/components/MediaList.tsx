import { PlayCircleIcon } from '@heroicons/react/20/solid'
import { HeartFillIcon } from '@primer/octicons-react'
import { ReactNode } from 'react'
import { MediaItem } from '../api/jellyfin'
import { usePlaybackContext } from '../context/PlaybackContext/PlaybackContext'
import { useDisplayItems } from '../hooks/useDisplayItems'
import { JellyImg } from './JellyImg'
import { Loader } from './Loader'
import { Skeleton } from './Skeleton'
import { Squircle } from './Squircle'
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
    type: 'movie' | 'album' | 'artist' | 'playlist' | 'genre'
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
                <div className={`media-item movie-item ${className || ''}`} ref={el => setRowRefs(index, el)}>
                    <Skeleton type="movie" />
                </div>
            )
        }

        return (
            <div
                className={`media-item movie-item ${className || ''}`}
                ref={el => setRowRefs(index, el)}
                onClick={() => playTrack(item)}
                style={{ cursor: 'pointer' }}
            >
                <Squircle width={153} height={230} cornerRadius={8} className="media-portrait">
                    <JellyImg item={item} type={'Primary'} width={153} height={230} />
                    <MediaIndicators item={item} disableActions={disableActions} removeButton={removeButton} />
                    <div className="overlay">
                        <div className="play">
                            <PlayCircleIcon className="heroicons" />
                        </div>
                    </div>
                </Squircle>
                <div className="media-details">
                    <span className="name" title={item.Name}>
                        {item.Name}
                    </span>
                    <div
                        className="date"
                        title={
                            item.PremiereDate && !isNaN(Date.parse(item.PremiereDate))
                                ? new Date(item.PremiereDate).getFullYear().toString()
                                : ''
                        }
                    >
                        {item.PremiereDate ? new Date(item.PremiereDate).getFullYear() : ''}
                    </div>
                </div>
            </div>
        )
    }

    if (isLoading && items.length === 0) {
        return <Loader />
    }

    if (items.length === 0 && !isLoading) {
        return (
            <div className="empty">
                {type === 'movie'
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
