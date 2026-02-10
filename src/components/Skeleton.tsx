import './Skeleton.css'

export const Skeleton = ({
    type,
}: {
    type: 'movie' | 'series' | 'episode' | 'mixed' | 'mixedSmall' | 'specials' | 'collection' | 'playlist' | 'person'
}) => {
    const isPortrait =
        type === 'movie' || type === 'series' || type === 'collection' || type === 'playlist' || type === 'person'
    const isSpecials = type === 'specials'

    const rootClass = `
        skeleton-loading
        ${isPortrait ? 'portrait' : 'landscape'}
        ${type === 'mixed' ? 'continue-watching' : ''}
        ${type === 'person' ? 'square' : ''}
    `.trim()

    return (
        <div className={rootClass}>
            <div
                className={`skeleton-effect thumbnail ${isPortrait ? 'portrait' : 'landscape'} ${
                    type === 'episode' || type === 'specials' || type === 'mixedSmall'
                        ? 'episode'
                        : type === 'mixed'
                          ? 'continue-watching'
                          : ''
                }`}
            />
            <div className="skeleton-details">
                <div className="skeleton-effect title" />
                {!isSpecials && <div className="skeleton-effect subtitle" />}
            </div>
        </div>
    )
}
