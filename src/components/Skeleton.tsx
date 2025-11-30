import './Skeleton.css'

export const Skeleton = ({ type = 'album' }: { type?: 'song' | 'album' | 'artist' | 'playlist' | 'genre' }) => (
    <div className="skeleton-loading">
        <div
            className={`skeleton-effect thumbnail ${
                type === 'playlist' ? 'playlist' : type === 'artist' ? 'artist' : type === 'genre' ? 'genre' : ''
            }`}
        ></div>
        <div className="skeleton-details">
            {type === 'album' && (
                <>
                    <div className="skeleton-effect album title"></div>
                    <div className="skeleton-effect album artist"></div>
                </>
            )}
            {type === 'artist' && (
                <>
                    <div className="skeleton-effect artist title"></div>
                </>
            )}
            {type === 'song' && (
                <>
                    <div className="skeleton-effect track title"></div>
                    <div className="skeleton-effect track artist"></div>
                </>
            )}
            {type === 'playlist' && (
                <>
                    <div className="skeleton-effect playlist title"></div>
                    <div className="skeleton-effect playlist artist"></div>
                </>
            )}
            {type === 'genre' && (
                <>
                    <div className="skeleton-effect genre title"></div>
                </>
            )}
        </div>
        {type === 'playlist' && (
            <div className="skeleton-indicators">
                <div className="skeleton-effect duration"></div>
            </div>
        )}
    </div>
)
