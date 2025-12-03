import { useEffect, useRef, useState } from 'react'
import type { VirtuosoGridProps } from 'react-virtuoso'
import { VirtuosoGrid, VirtuosoGridHandle } from 'react-virtuoso'
import { MediaItem } from '../api/jellyfin.ts'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IVirtuosoProps = VirtuosoGridProps<MediaItem | { isPlaceholder: true }, any>

// Global Map to store scroll offsets keyed by history state index
const scrollOffsets = new Map<number, { pathname: string; offset: number }>()

export const VirtuosoWindow = (virtuosoProps: IVirtuosoProps) => {
    const virtuosoRef = useRef<VirtuosoGridHandle>(null)
    const wrapperRef = useRef<HTMLDivElement>(null)

    const [initialOffset, setInitialOffset] = useState(0)

    useEffect(() => {
        setInitialOffset(wrapperRef.current?.getBoundingClientRect().top || 0)
    }, [wrapperRef])

    useEffect(() => {
        const onScroll = () => {
            const idx = history.state?.idx
            if (idx !== undefined) {
                scrollOffsets.set(idx, {
                    pathname: window.location.pathname,
                    offset: window.scrollY - initialOffset,
                })
            }
        }

        window.addEventListener('scrollend', onScroll, { passive: true })
        return () => window.removeEventListener('scrollend', onScroll)
    }, [initialOffset])

    const saved = scrollOffsets.get(history.state?.idx)
    const savedOffset = saved?.pathname === window.location.pathname ? saved.offset : 0

    useEffect(() => {
        if (savedOffset && initialOffset) {
            window.scrollTo(0, savedOffset + initialOffset)
        }
    }, [savedOffset, initialOffset])

    return (
        <div ref={wrapperRef}>
            <VirtuosoGrid {...virtuosoProps} ref={virtuosoRef} useWindowScroll listClassName="virtuoso-grid-list" />
        </div>
    )
}
