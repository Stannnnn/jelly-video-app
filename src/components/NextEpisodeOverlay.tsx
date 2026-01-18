import { MediaItem } from '../api/jellyfin'
import './NextEpisodeOverlay.css'

interface NextEpisodeOverlayProps {
    nextEpisode: MediaItem | undefined
    countdown: number
    onPlayNow: () => void
    onCancel: () => void
    isVisible: boolean
}

export const NextEpisodeOverlay = ({
    nextEpisode,
    countdown,
    onPlayNow,
    onCancel,
    isVisible,
}: NextEpisodeOverlayProps) => {
    if (!nextEpisode) return null

    const episodeInfo = nextEpisode.IndexNumber
        ? `Episode ${nextEpisode.IndexNumber}`
        : nextEpisode.ParentIndexNumber
          ? `Season ${nextEpisode.ParentIndexNumber}`
          : ''

    const seasonInfo =
        nextEpisode.ParentIndexNumber && nextEpisode.IndexNumber
            ? `S${nextEpisode.ParentIndexNumber}E${nextEpisode.IndexNumber}`
            : episodeInfo

    return (
        <div className={`next-episode-overlay ${isVisible ? 'visible' : ''}`}>
            <div className="next-episode-content">
                <div className="next-episode-header">
                    <div className="next-episode-title">Next Episode</div>
                    <div className="next-episode-countdown">{countdown}s</div>
                </div>
                <div className="next-episode-info">
                    <div className="next-episode-name">{nextEpisode.Name}</div>
                    {seasonInfo && <div className="next-episode-number">{seasonInfo}</div>}
                    {nextEpisode.SeriesName && <div className="next-episode-series">{nextEpisode.SeriesName}</div>}
                </div>
                <div className="next-episode-actions">
                    <button className="next-episode-btn play-now" onClick={onPlayNow}>
                        Play Now
                    </button>
                    <button className="next-episode-btn cancel" onClick={onCancel}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
}
