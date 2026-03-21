import './Skeleton.css'

export const Skeleton = ({
    type,
    hideSubtitle = false,
}: {
    type: 'movie' | 'series' | 'episode' | 'mixed' | 'mixedSmall' | 'specials' | 'collection' | 'playlist' | 'person'
    hideSubtitle?: boolean
}) => {
    const isPortrait =
        type === 'movie' || type === 'series' || type === 'collection' || type === 'person' || type === 'playlist'

    return (
        <div
            className={`
                skeleton-loading
                ${isPortrait ? 'portrait' : 'landscape'}
                ${type === 'mixed' ? 'continue-watching' : ''}
                ${type === 'person' ? 'square' : ''}
                ${type === 'playlist' ? 'playlist-item' : ''}
            `.trim()}
        >
            <div
                className={`skeleton-effect thumbnail ${isPortrait ? 'portrait' : 'landscape'} ${
                    type === 'episode' || type === 'specials' || type === 'mixedSmall'
                        ? 'episode'
                        : type === 'mixed'
                          ? 'continue-watching'
                          : type === 'person'
                            ? 'square'
                            : type === 'playlist'
                              ? 'playlist-item'
                              : ''
                }`}
            />
            <div className="skeleton-details">
                <div className="skeleton-effect title" />
                {!hideSubtitle && type !== 'specials' && type !== 'playlist' && (
                    <div className="skeleton-effect subtitle" />
                )}
            </div>
        </div>
    )
}
