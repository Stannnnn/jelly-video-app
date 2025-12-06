import { HeartFillIcon } from '@primer/octicons-react'
import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { MediaItem } from '../api/jellyfin'
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
    virtuosoType,
    loadMore,
    disableActions = false,
    removeButton,
    className,
}: {
    items: MediaItem[] | undefined
    isLoading: boolean
    type: 'movie' | 'series' | 'episode' | 'collection' | 'mixed'
    virtuosoType?: 'vertical' | 'horizontal' | 'grid'
    loadMore?: () => void
    disableActions?: boolean
    removeButton?: (item: MediaItem) => ReactNode
    className?: string
}) => {
    const { displayItems, setRowRefs } = useDisplayItems(items, isLoading)
    const navigate = useNavigate()

    const handleItemClick = (item: MediaItem) => {
        // Determine the route based on item type
        const itemType = item.Type?.toLowerCase()

        if (itemType === 'movie') {
            navigate(`/movie/${item.Id}`)
        } else if (itemType === 'series') {
            navigate(`/series/${item.Id}`)
        } else if (itemType === 'episode') {
            navigate(`/episode/${item.Id}`)
        } else if (itemType === 'boxset') {
            navigate(`/collection/${item.Id}`)
        } else {
            // Fallback to play route for other types
            navigate(`/play/${item.Id}`)
        }
    }

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
                onClick={() => handleItemClick(item)}
            >
                <Squircle width={152} height={228} cornerRadius={8} className="media-portrait">
                    <JellyImg item={item} type={'Primary'} width={152} height={228} />
                    <MediaIndicators item={item} disableActions={disableActions} removeButton={removeButton} />
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
        const emptyMessage = {
            movie: 'No movies were found',
            series: 'No shows were found',
            episode: 'No episodes were found',
            collection: 'No collections were found',
            mixed: 'No items were found',
        }[type]

        return <div className="empty">{emptyMessage}</div>
    }

    return (
        <ul className="media-list noSelect">
            <VirtuosoWindow
                type={virtuosoType || 'grid'}
                data={displayItems}
                itemContent={renderItem}
                endReached={loadMore}
                overscan={800}
            />
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
