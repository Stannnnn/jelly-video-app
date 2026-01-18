import { MediaItem } from '../api/jellyfin'
import { useDisplayTitle } from '../hooks/useDisplayTitle'
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
    const displayTitle = useDisplayTitle(nextEpisode)

    if (!nextEpisode) return null

    return (
        <div className={`next-episode-overlay ${isVisible ? 'visible' : ''}`}>
            <div className="next-episode-content">
                <div className="next-episode-header">
                    <div className="next-episode-title">Next Episode</div>
                    <div className="next-episode-countdown">{countdown}s</div>
                </div>
                <div className="next-episode-info">
                    <div className="container">
                        <div className="series">{nextEpisode.SeriesName}</div>
                    </div>
                    <div className="next-episode-number">{displayTitle}</div>
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
