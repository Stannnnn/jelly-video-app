import { CheckCircleFillIcon, HeartFillIcon } from '@primer/octicons-react'
import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { MediaItem } from '../api/jellyfin'
import { useDisplayItems } from '../hooks/useDisplayItems'
import { JellyImg } from './JellyImg'
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
    parentItem,
}: {
    items: MediaItem[] | undefined
    isLoading: boolean
    type: 'movie' | 'series' | 'episode' | 'collection' | 'mixed' | 'mixedSmall' | 'specials' | 'person'
    virtuosoType?: 'vertical' | 'horizontal' | 'grid'
    loadMore?: () => void
    disableActions?: boolean
    disableEvents?: boolean
    removeButton?: (item: MediaItem) => ReactNode
    className?: string
    parentItem?: MediaItem
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

        if (type === 'movie' || type === 'series' || type === 'collection') {
            //  const isSeriesLike = type === 'series' || (type === 'collection' && item.CollectionType === 'tvshows')
            const isSeriesLike = type === 'series' || type === 'collection'

            return (
                <div
                    className={`media-item portrait ${isSeriesLike ? 'series-item' : 'movie-item'} ${className || ''}`}
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

                                {isSeriesLike &&
                                    item.EndDate &&
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
            const isActive = parentItem && item.Id === parentItem.Id

            return (
                <div
                    className={`media-item landscape episode-item ${isActive ? 'active' : ''} ${className || ''}`}
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
                    className={`media-item landscape continue-watching ${className || ''}`}
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
                                <VideoPlayIcon width={28} height={28} />
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
        } else if (type === 'mixedSmall') {
            return (
                <div
                    className={`media-item landscape recently-played ${className || ''}`}
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
                        <JellyImg
                            item={item}
                            type={item.Type === 'Episode' || item.Type === 'Video' ? 'Primary' : 'Backdrop'}
                            width={280}
                            height={158}
                        />
                        <MediaIndicators item={item} disableActions={disableActions} removeButton={removeButton} />
                        <div className="overlay">
                            <div className="play">
                                <VideoPlayIcon width={24} height={24} />
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
        } else if (type === 'specials') {
            return (
                <div className={`media-item landscape specials ${className || ''}`} ref={el => setRowRefs(index, el)}>
                    <Squircle
                        width={240}
                        height={135}
                        cornerRadius={8}
                        className="media-thumbnail"
                        {...(disableEvents ? {} : { onClick: () => navigate(`/play/${item.Id}`) })}
                    >
                        <JellyImg
                            item={item}
                            type={item.Type === 'Episode' || item.Type === 'Video' ? 'Primary' : 'Backdrop'}
                            width={240}
                            height={135}
                        />
                        <MediaIndicators item={item} disableActions={disableActions} removeButton={removeButton} />
                        <div className="overlay">
                            <div className="play">
                                <VideoPlayIcon width={24} height={24} />
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
                    <div className="media-details" {...(disableEvents ? {} : { onClick: () => handleItemClick(item) })}>
                        {item.Type === 'Episode' ? (
                            <>
                                <span className="title" title={item.Name}>
                                    {item.Name}
                                </span>
                                <div className="container">
                                    <div className="subtitle season-episode">
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
                            <div className="subtitle date premiere">{new Date(item.PremiereDate).getFullYear()}</div>
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

    if (items.length === 0 && !isLoading) {
        const emptyMessage = {
            movie: 'No movies were found',
            series: 'No series were found',
            episode: 'No episodes were found',
            collection: 'No items were found',
            mixed: 'No items were found',
            mixedSmall: 'No items were found',
            specials: 'No specials were found',
            person: 'No people were found',
        }[type]

        return <div className="empty">{emptyMessage}</div>
    }

    if (!displayItems.length) {
        return null
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
            {!disableActions && item.UserData?.Played && (
                <div className="icon watched" title="Watched">
                    <CheckCircleFillIcon size={16} />
                </div>
            )}
            {!disableActions && item.UserData?.IsFavorite && location.pathname !== '/favorites' && (
                <div className="icon favorited" title="Favorited">
                    <HeartFillIcon size={16} />
                </div>
            )}
        </div>
    )
}
