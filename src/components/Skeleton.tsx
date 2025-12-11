import './Skeleton.css'

export const Skeleton = ({ type }: { type: 'movie' | 'series' | 'episode' | 'mixed' | 'collection' }) => {
    const isPortrait = type === 'movie' || type === 'series' || type === 'collection'

    return (
        <div className={`skeleton-loading ${isPortrait ? 'portrait' : 'landscape'}`}>
            <div
                className={`skeleton-effect thumbnail ${isPortrait ? 'portrait' : 'landscape'} ${
                    type === 'episode' ? 'episode' : type === 'mixed' ? 'continue-watching' : ''
                }`}
            />
            <div className="skeleton-details">
                <div className="skeleton-effect title" />
                <div className="skeleton-effect subtitle" />
            </div>
        </div>
    )
}
