import { ItemSortBy, SortOrder } from '@jellyfin/sdk/lib/generated-client'
import { ChevronDownIcon } from '@primer/octicons-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { MediaItem } from '../api/jellyfin'
import { Loader } from '../components/Loader'
import { MediaFooter } from '../components/MediaFooter'
import { MediaInfo } from '../components/MediaInfo'
import { MediaList } from '../components/MediaList'
import { SortingIcon } from '../components/SvgIcons'
import { SortState } from '../context/FilterContext/FilterContext'
import { useJellyfinCastCrew } from '../hooks/Jellyfin/useJellyfinCastCrew'
import { useJellyfinEpisodes } from '../hooks/Jellyfin/useJellyfinEpisodes'
import { useJellyfinMediaItem } from '../hooks/Jellyfin/useJellyfinMediaItem'
import { useJellyfinSeasons } from '../hooks/Jellyfin/useJellyfinSeasons'
import { useJellyfinSimilarItems } from '../hooks/Jellyfin/useJellyfinSimilarItems'
import { useJellyfinSpecials } from '../hooks/Jellyfin/useJellyfinSpecials'
import './MediaPages.css'

export const SeriesPage = () => {
    const { id } = useParams<{ id: string }>()

    const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null)
    const [uiSortBy, setUiSortBy] = useState<SortState>(SortState.Released)
    const [sortBy, setSortBy] = useState<ItemSortBy[]>([ItemSortBy.PremiereDate])
    const [sortOrder, setSortOrder] = useState<SortOrder[]>([SortOrder.Descending])

    const { mediaItem: series, isLoading: isLoadingSeries, error: seriesError } = useJellyfinMediaItem(id)
    const { people, isLoading: isLoadingCastCrew } = useJellyfinCastCrew(id)
    const { similarItems, isLoading: isLoadingSimilar } = useJellyfinSimilarItems(id)

    // Reset selected season when series changes
    useEffect(() => {
        setSelectedSeasonId(null)
    }, [id])

    const { seasons, isLoading: isLoadingSeasons, error: seasonsError } = useJellyfinSeasons(id)

    /* Flipping sort order for PremiereDate so it makes sense visually */
    const effectiveSortOrder =
        sortBy[0] === ItemSortBy.PremiereDate
            ? sortOrder[0] === SortOrder.Descending
                ? SortOrder.Ascending
                : SortOrder.Descending
            : sortOrder[0]

    const effectiveSortBy = sortBy.concat(ItemSortBy.IndexNumber)

    const { episodes, isLoading: isLoadingEpisodes } = useJellyfinEpisodes(selectedSeasonId, effectiveSortBy, [
        effectiveSortOrder,
    ])

    const { specials, isLoading: isLoadingSpecials } = useJellyfinSpecials(id)

    // Auto-select first season if available
    if (seasons && seasons.length > 0 && !selectedSeasonId) {
        setSelectedSeasonId(seasons[0].Id)
    }

    if (isLoadingSeries) {
        return <Loader />
    }

    if (seriesError || !series) {
        return <div className="error">{seriesError || 'Series not found'}</div>
    }

    const handleSeasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedSeasonId(e.target.value)
    }

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value as SortState
        setUiSortBy(value)

        let newSortBy: ItemSortBy[]

        switch (value) {
            case SortState.Added:
                newSortBy = [ItemSortBy.DateCreated]
                break
            case SortState.Released:
                newSortBy = [ItemSortBy.PremiereDate]
                break
            case SortState.Runtime:
                newSortBy = [ItemSortBy.Runtime]
                break
            case SortState.Name:
                newSortBy = [ItemSortBy.Name]
                break
            default:
                newSortBy = [ItemSortBy.PremiereDate]
        }

        setSortBy(newSortBy)
    }

    const handleSortOrderToggle = () => {
        setSortOrder(prev => (prev[0] === SortOrder.Ascending ? [SortOrder.Descending] : [SortOrder.Ascending]))
    }

    return (
        <div className="media-page series">
            <MediaInfo item={series} />
            <div className="media-content">
                <div className="section options">
                    <div className="container">
                        {seasons && seasons.length > 0 && (
                            <>
                                <div className="option primary">
                                    <div className="sorting seasons">
                                        <div className="filter">
                                            <select value={selectedSeasonId || ''} onChange={handleSeasonChange}>
                                                {seasons.map((season: MediaItem) => (
                                                    <option key={season.Id} value={season.Id}>
                                                        {season.Name}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="icon">
                                                <ChevronDownIcon size={12} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="option secondary">
                                    <div className="sorting date">
                                        <div className="filter">
                                            <select value={uiSortBy} onChange={handleSortChange}>
                                                <option value={SortState.Released}>Premiered</option>
                                                <option value={SortState.Runtime}>Runtime</option>
                                                <option value={SortState.Name}>Name</option>
                                                <option value={SortState.Added}>Added</option>
                                            </select>
                                            <div className="icon">
                                                <ChevronDownIcon size={12} />
                                            </div>
                                        </div>
                                        <div
                                            className="sort"
                                            onClick={handleSortOrderToggle}
                                            title={sortOrder[0] === SortOrder.Ascending ? 'Ascending' : 'Descending'}
                                        >
                                            <div
                                                className={
                                                    'icon' + (sortOrder[0] === SortOrder.Ascending ? ' active' : '')
                                                }
                                            >
                                                <SortingIcon width={12} height={12} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    {!isLoadingSeasons && !seasonsError && (
                        <MediaList items={episodes || []} isLoading={isLoadingEpisodes} type="episode" />
                    )}
                </div>
                {specials && specials.length > 0 && (
                    <div className="section specials">
                        <div className="container">
                            <div className="title">Specials</div>
                        </div>
                        <MediaList items={specials} isLoading={isLoadingSpecials} type="specials" />
                    </div>
                )}
                {people && people.length > 0 && (
                    <div className="section cast-crew">
                        <div className="container">
                            <div className="title">Cast & Crew</div>
                        </div>
                        <MediaList items={people} isLoading={isLoadingCastCrew} type="person" />
                    </div>
                )}
                {similarItems && similarItems.length > 0 && (
                    <div className="section recommended">
                        <div className="container">
                            <div className="title">Recommended</div>
                        </div>
                        <MediaList items={similarItems} isLoading={isLoadingSimilar} type="series" />
                    </div>
                )}
            </div>
            <MediaFooter item={series} />
        </div>
    )
}
