import { useEffect, useState } from 'react'
import { MediaItem } from '../api/jellyfin'
import { useJellyfinContext } from '../context/JellyfinContext/JellyfinContext'
import { TracksIcon } from './SvgIcons'

export const JellyImg = ({
    item,
    type,
    width,
    height,
    imageProps,
}: {
    item: MediaItem
    type: 'Primary' | 'Backdrop'
    width: number
    height: number
    imageProps?: React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>
}) => {
    const api = useJellyfinContext()
    const [hasError, setError] = useState(false)

    const onlineImageUrl = api.getImageUrl(item, type, { width, height })

    const src = item.downloadedImageUrl || onlineImageUrl

    useEffect(() => {
        setError(false)
    }, [src])

    return (
        <>
            {!hasError && src && (
                <img
                    {...imageProps}
                    src={src}
                    alt={item.Name}
                    className="thumbnail"
                    loading="lazy"
                    onError={() => setError(true)}
                />
            )}

            {(hasError || !src) && (
                <div className="fallback-thumbnail">
                    <TracksIcon width="50%" height="50%" />
                </div>
            )}
        </>
    )
}
