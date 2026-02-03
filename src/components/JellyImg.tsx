import { useState } from 'react'
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
    const onlineImageUrl = api.getImageUrl(item, type, { width, height })
    const src = item.downloadedImageUrl || onlineImageUrl

    return <InternalJellyImg key={src} item={item} imageProps={imageProps} fallback={fallback} src={src} />
}

const InternalJellyImg = ({
    item,
    imageProps,
    fallback,
    src,
}: {
    item: MediaItem
    imageProps?: React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>
    fallback?: React.ReactNode
    src?: string
}) => {
    const [hasError, setError] = useState(false)
    const [isLoaded, setIsLoaded] = useState(false)

    return (
        <>
            {!hasError && src && (
                <img
                    {...imageProps}
                    src={src}
                    alt={item.Name}
                    className="thumbnail"
                    loading="lazy"
                    style={{ opacity: isLoaded ? undefined : 0, ...imageProps?.style }}
                    onLoad={() => setIsLoaded(true)}
                    onError={() => setError(true)}
                />
            )}

            {(hasError || !src) &&
                (fallback || <div className="fallback-thumbnail" data-orig-src={src || 'undefined'}></div>)}
        </>
    )
}
