import './Skeleton.css'

export const Skeleton = ({ type }: { type: string }) => (
    <div className="skeleton-loading">
        <div className="skeleton-effect thumbnail"></div>
        <div className="skeleton-details">
            <div className="skeleton-effect track title"></div>
            <div className="skeleton-effect track artist"></div>
        </div>
    </div>
)
