import { useEffect, useState } from 'react'
import { MediaItem } from '../api/jellyfin'
import { useJellyfinContext } from '../context/JellyfinContext/JellyfinContext'

export const JellyImg = ({
    item,
    type,
    width,
    height,
    imageProps,
    fallback,
}: {
    item: MediaItem
    type: 'Primary' | 'Backdrop' | 'Logo' | 'Thumb'
    width: number
    height: number
    imageProps?: React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>
    fallback?: React.ReactNode
}) => {
    const api = useJellyfinContext()
    const [hasError, setError] = useState(false)
    const [isLoaded, setIsLoaded] = useState(false)

    const onlineImageUrl = api.getImageUrl(item, type, { width, height })

    const src = item.downloadedImageUrl || onlineImageUrl

    useEffect(() => {
        setError(false)
        setIsLoaded(false)
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
                    style={{ opacity: isLoaded ? 1 : 0, ...imageProps?.style }}
                    onLoad={() => setIsLoaded(true)}
                    onError={() => setError(true)}
                />
            )}

            {(hasError || !src) &&
                (fallback || <div className="fallback-thumbnail" data-orig-src={src || 'undefined'}></div>)}
        </>
    )
}
