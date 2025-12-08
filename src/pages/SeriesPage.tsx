import { ChevronDownIcon } from '@primer/octicons-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { MediaItem } from '../api/jellyfin'
import { InlineLoader } from '../components/InlineLoader'
import { Loader } from '../components/Loader'
import { MediaInfo } from '../components/MediaInfo'
import { MediaList } from '../components/MediaList'
import { useJellyfinEpisodes } from '../hooks/Jellyfin/useJellyfinEpisodes'
import { useJellyfinMediaItem } from '../hooks/Jellyfin/useJellyfinMediaItem'
import { useJellyfinSeasons } from '../hooks/Jellyfin/useJellyfinSeasons'
import './MediaPages.css'

export const SeriesPage = () => {
    const { id } = useParams<{ id: string }>()
    const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null)

    const { mediaItem: series, isLoading: isLoadingSeries, error: seriesError } = useJellyfinMediaItem(id)

    const { seasons, isLoading: isLoadingSeasons, error: seasonsError } = useJellyfinSeasons(id)

    const { episodes, isLoading: isLoadingEpisodes } = useJellyfinEpisodes(selectedSeasonId)

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
                        {isLoadingSeasons ? (
                            <InlineLoader />
                        ) : seasonsError ? (
                            <div className="error">{seasonsError || 'Failed to load season'}</div>
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
