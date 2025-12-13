import { HeartFillIcon } from '@primer/octicons-react'
import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { MediaItem } from '../api/jellyfin'
import { useDisplayItems } from '../hooks/useDisplayItems'
import { JellyImg } from './JellyImg'
import { Loader } from './Loader'
import { Skeleton } from './Skeleton'
import { Squircle } from './Squircle'
import { VideoPlayIcon } from './SvgIcons'
import { VirtuosoWindow } from './VirtuosoWindow'

export const MediaList = ({
    items = [],
    isLoading,
    type,
    virtuosoType,
    loadMore,
    disableActions = false,
    disableEvents = false,
    removeButton,
    className,
}: {
    items: MediaItem[] | undefined
    isLoading: boolean
    type: 'movie' | 'series' | 'episode' | 'collection' | 'mixed' | 'person'
    virtuosoType?: 'vertical' | 'horizontal' | 'grid'
    loadMore?: () => void
    disableActions?: boolean
    disableEvents?: boolean
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
        } else if (itemType === 'person' || type === 'person') {
            navigate(`/person/${item.Id}`)
        } else {
            // Fallback to play route for other types
            navigate(`/play/${item.Id}`)
        }
    }

    const renderItem = (index: number, item: MediaItem | { isPlaceholder: true } | undefined) => {
        if (!item || 'isPlaceholder' in item) {
            return (
                <div className={`media-item ${className || ''}`} ref={el => setRowRefs(index, el)}>
                    <Skeleton type={type === 'series' || type === 'collection' || type === 'person' ? 'movie' : type} />
                </div>
            )
        }

        if (type === 'movie' || type === 'collection') {
            return (
                <div
                    className={`media-item portrait movie-item ${className || ''}`}
                    ref={el => setRowRefs(index, el)}
                    {...(disableEvents
                        ? {}
                        : {
                              onClick: () => handleItemClick(item),
                          })}
                >
                    <Squircle width={152} height={228} cornerRadius={8} className="media-thumbnail">
                        <JellyImg item={item} type={'Primary'} width={152} height={228} />
                        <MediaIndicators item={item} disableActions={disableActions} removeButton={removeButton} />
                    </Squircle>
                    <div className="media-details">
                        <span className="title" title={item.Name}>
                            {item.Name}
                        </span>
                        <div
                            className="subtitle date"
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
        } else if (type === 'series') {
            return (
                <div
                    className={`media-item portrait series-item ${className || ''}`}
                    ref={el => setRowRefs(index, el)}
                    {...(disableEvents
                        ? {}
                        : {
                              onClick: () => handleItemClick(item),
                          })}
                >
                    <Squircle width={152} height={228} cornerRadius={8} className="media-thumbnail">
                        <JellyImg item={item} type={'Primary'} width={152} height={228} />
                        <MediaIndicators item={item} disableActions={disableActions} removeButton={removeButton} />
                    </Squircle>
                    <div className="media-details">
                        <span className="title" title={item.Name}>
                            {item.Name}
                        </span>
                        {item.PremiereDate && (
                            <div className="container">
                                <div
                                    className="subtitle date premiere"
                                    title={new Date(item.PremiereDate).getFullYear().toString()}
                                >
                                    {new Date(item.PremiereDate).getFullYear()}
                                </div>

                                {item.EndDate &&
                                    new Date(item.EndDate).getFullYear() !==
                                        new Date(item.PremiereDate).getFullYear() && (
                                        <>
                                            <div className="divider">-</div>
                                            <div
                                                className="subtitle date end"
                                                title={new Date(item.EndDate).getFullYear().toString()}
                                            >
                                                {new Date(item.EndDate).getFullYear()}
                                            </div>
                                        </>
                                    )}
                            </div>
                        )}
                    </div>
                </div>
            )
        } else if (type === 'episode') {
            return (
                <div
                    className={`media-item landscape episode-item ${className || ''}`}
                    ref={el => setRowRefs(index, el)}
                >
                    <Squircle
                        width={240}
                        height={135}
                        cornerRadius={8}
                        className="media-thumbnail"
                        {...(disableEvents
                            ? {}
                            : {
                                  onClick: () => {
                                      navigate(`/play/${item.Id}`)
                                  },
                              })}
                    >
                        <JellyImg item={item} type={'Primary'} width={240} height={135} />
                        <MediaIndicators item={item} disableActions={disableActions} removeButton={removeButton} />
                        <div className="overlay">
                            <div className="play">
                                <VideoPlayIcon width={24} height={24} />
                            </div>
                        </div>
                    </Squircle>
                    <div
                        className="media-details"
                        {...(disableEvents
                            ? {}
                            : {
                                  onClick: () => handleItemClick(item),
                              })}
                    >
                        <span className="title" title={item.Name}>
                            {item.Name}
                        </span>
                        {item.PremiereDate && (
                            <div className="container">
                                <div className="subtitle episode-number" title={`Episode ${item.IndexNumber}`}>
                                    Episode {item.IndexNumber}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )
        } else if (type === 'mixed') {
            return (
                <div
                    className={`media-item continue-watching landscape mixed-item ${className || ''}`}
                    ref={el => setRowRefs(index, el)}
                >
                    <Squircle
                        width={280}
                        height={158}
                        cornerRadius={8}
                        className="media-thumbnail"
                        {...(disableEvents
                            ? {}
                            : {
                                  onClick: () => {
                                      navigate(`/play/${item.Id}`)
                                  },
                              })}
                    >
                        <JellyImg
                            item={item}
                            type={item.Type === 'Episode' || item.Type === 'Video' ? 'Primary' : 'Backdrop'}
                            width={280}
                            height={158}
                        />
                        <MediaIndicators item={item} disableActions={disableActions} removeButton={removeButton} />
                        <div className="overlay">
                            <div className="play">
                                <VideoPlayIcon width={32} height={32} />
                            </div>
                        </div>
                        {item.UserData?.PlayedPercentage &&
                            item.UserData.PlayedPercentage > 0 &&
                            item.UserData.PlayedPercentage < 100 && (
                                <div
                                    className="progress-indicator"
                                    title="Played duration"
                                    style={
                                        {
                                            '--progress-percent': `${item.UserData.PlayedPercentage}%`,
                                        } as React.CSSProperties
                                    }
                                />
                            )}
                    </Squircle>
                    <div
                        className="media-details"
                        {...(disableEvents
                            ? {}
                            : {
                                  onClick: () => handleItemClick(item),
                              })}
                    >
                        {item.Type === 'Episode' ? (
                            <>
                                <span className="title" title={item.SeriesName?.toString()}>
                                    {item.SeriesName}
                                </span>
                                <div className="container">
                                    <div
                                        className="subtitle season-episode"
                                        title={`Season ${String(item.ParentIndexNumber)} - Episode ${String(
                                            item.IndexNumber
                                        )}`}
                                    >
                                        S{String(item.ParentIndexNumber).padStart(2, '0')} E
                                        {String(item.IndexNumber).padStart(2, '0')}
                                    </div>
                                    {item.Name && (
                                        <>
                                            <div className="dot"></div>
                                            <div className="subtitle episode-name" title={item.Name}>
                                                {item.Name}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </>
                        ) : (
                            <span className="title" title={item.Name}>
                                {item.Name}
                            </span>
                        )}
                        {item.Type === 'Movie' && item.PremiereDate && (
                            <div
                                className="subtitle date premiere"
                                title={new Date(item.PremiereDate).getFullYear().toString()}
                            >
                                {new Date(item.PremiereDate).getFullYear()}
                            </div>
                        )}
                    </div>
                </div>
            )
        } else if (type === 'person') {
            return (
                <div
                    className={`media-item square person-item ${className || ''}`}
                    ref={el => setRowRefs(index, el)}
                    {...(disableEvents
                        ? {}
                        : {
                              onClick: () => handleItemClick(item),
                          })}
                >
                    <Squircle width={124} height={124} cornerRadius={12} className="media-thumbnail">
                        <JellyImg item={item} type={'Primary'} width={124} height={124} />
                    </Squircle>
                    <div className="media-details">
                        <span className="title" title={item.Name}>
                            {item.Name}
                        </span>
                        {(item as any).Role && (
                            <div className="subtitle role" title={(item as any).Role}>
                                {(item as any).Role}
                            </div>
                        )}
                    </div>
                </div>
            )
        }
    }

    if (isLoading && items.length === 0) {
        return <Loader />
    }

    if (items.length === 0 && !isLoading) {
        const emptyMessage = {
            movie: 'No movies were found',
            series: 'No series were found',
            episode: 'No episodes were found',
            collection: 'No collections were found',
            mixed: 'No items were found',
            person: 'No people were found',
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
