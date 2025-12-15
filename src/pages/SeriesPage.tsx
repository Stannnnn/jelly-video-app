import { ChevronDownIcon } from '@primer/octicons-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { MediaItem } from '../api/jellyfin'
import { Loader } from '../components/Loader'
import { MediaInfo } from '../components/MediaInfo'
import { MediaList } from '../components/MediaList'
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

    const { mediaItem: series, isLoading: isLoadingSeries, error: seriesError } = useJellyfinMediaItem(id)
    const { people, isLoading: isLoadingCastCrew } = useJellyfinCastCrew(id)
    const { similarItems, isLoading: isLoadingSimilar } = useJellyfinSimilarItems(id)

    // Reset selected season when series changes
    useEffect(() => {
        setSelectedSeasonId(null)
    }, [id])

    const { seasons, isLoading: isLoadingSeasons, error: seasonsError } = useJellyfinSeasons(id)

    const { episodes, isLoading: isLoadingEpisodes } = useJellyfinEpisodes(selectedSeasonId)

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

    return (
        <div className="media-page series">
            <MediaInfo item={series} />
            <div className="media-content">
                <div className="section seasons">
                    <div className="container">
                        {seasons && seasons.length > 0 && (
                            <div className="sorting">
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
                        )}
                        {/* Inline loader test next to select
                        {isLoadingSeasons ? (
                            <InlineLoader />
                        ) : seasonsError ? (
                            <div className="error">{seasonsError || 'Failed to load season'}</div>
                        ) : null}
                        */}
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
        </div>
    )
}
