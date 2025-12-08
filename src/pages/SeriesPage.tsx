import { ChevronDownIcon } from '@primer/octicons-react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { MediaItem } from '../api/jellyfin'
import { InlineLoader } from '../components/InlineLoader'
import { Loader } from '../components/Loader'
import { MediaInfo } from '../components/MediaInfo'
import { MediaList } from '../components/MediaList'
import { useJellyfinContext } from '../context/JellyfinContext/JellyfinContext'
import './MediaPages.css'

export const SeriesPage = () => {
    const { id } = useParams<{ id: string }>()
    const api = useJellyfinContext()
    const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null)

    const {
        data: series,
        isLoading: isLoadingSeries,
        error: seriesError,
    } = useQuery({
        queryKey: ['series', id],
        queryFn: () => api.getItemById(id!),
        enabled: !!id,
    })

    const {
        data: seasons,
        isLoading: isLoadingSeasons,
        error: seasonsError,
    } = useQuery({
        queryKey: ['series-seasons', id],
        queryFn: () => api.getSeasons(id!),
        enabled: !!id,
    })

    const { data: episodes, isLoading: isLoadingEpisodes } = useQuery({
        queryKey: ['season-episodes', selectedSeasonId],
        queryFn: () => api.getEpisodes(selectedSeasonId!),
        enabled: !!selectedSeasonId,
    })

    // Auto-select first season if available
    if (seasons && seasons.length > 0 && !selectedSeasonId) {
        setSelectedSeasonId(seasons[0].Id)
    }

    if (isLoadingSeries) {
        return <Loader />
    }

    if (seriesError || !series) {
        return <div className="error">Failed to load series</div>
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
                        {isLoadingSeasons ? (
                            <InlineLoader />
                        ) : seasonsError ? (
                            <div className="error">Failed to load season</div>
                        ) : null}
                    </div>
                    {!isLoadingSeasons && !seasonsError && (
                        <MediaList items={episodes || []} isLoading={isLoadingEpisodes} type="episode" />
                    )}
                </div>
            </div>
        </div>
    )
}
