import { useEffect, useRef, useState } from 'react'
import type { VirtuosoGridProps, VirtuosoProps } from 'react-virtuoso'
import { Virtuoso, VirtuosoGrid, VirtuosoGridHandle, VirtuosoHandle } from 'react-virtuoso'
import { MediaItem } from '../api/jellyfin.ts'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IVirtuosoListProps = VirtuosoProps<MediaItem | { isPlaceholder: true }, any>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IVirtuosoGridProps = VirtuosoGridProps<MediaItem | { isPlaceholder: true }, any>

type VirtuosoWindowProps =
    | ({
          type: 'vertical' | 'horizontal'
          virtuosoRef?: React.RefObject<VirtuosoHandle | null>
          onRangeChange?: (range: { startIndex: number; endIndex: number }) => void
      } & IVirtuosoListProps)
    | ({
          type: 'grid'
          virtuosoRef?: React.RefObject<VirtuosoGridHandle | null>
          onRangeChange?: (range: { startIndex: number; endIndex: number }) => void
      } & IVirtuosoGridProps)

// Global Map to store scroll offsets keyed by history state index
const scrollOffsets = new Map<number, { pathname: string; offset: number }>()

export const VirtuosoWindow = ({
    type,
    virtuosoRef: externalRef,
    onRangeChange,
    ...virtuosoProps
}: VirtuosoWindowProps) => {
    const internalRef = useRef<VirtuosoHandle | VirtuosoGridHandle>(null)
    const virtuosoRef = externalRef || internalRef
    const wrapperRef = useRef<HTMLDivElement>(null)

    const [initialOffset, setInitialOffset] = useState(0)

    const isGrid = type === 'grid'
    const isHorizontal = type === 'horizontal'

    useEffect(() => {
        if (isHorizontal) return
        setInitialOffset(wrapperRef.current?.getBoundingClientRect().top || 0)
    }, [wrapperRef, isHorizontal])

    useEffect(() => {
        if (isHorizontal) return

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
    }, [initialOffset, isHorizontal])

    const saved = scrollOffsets.get(history.state?.idx)
    const savedOffset = saved?.pathname === window.location.pathname ? saved.offset : 0

    if (isGrid) {
        const [resizeKey, setResizeKey] = useState(0)
        const lastScroll = useRef(savedOffset)

        useEffect(() => {
            const debounce = (fn: () => void, ms: number) => {
                let timer: NodeJS.Timeout | null = null
                return () => {
                    if (timer) clearTimeout(timer)
                    timer = setTimeout(fn, ms)
                }
            }

            const handleResize = debounce(() => {
                lastScroll.current = window.scrollY - initialOffset
                setResizeKey(k => k + 1)
            }, 100)

            window.addEventListener('resize', handleResize)
            document.addEventListener('fullscreenchange', handleResize)

            return () => {
                window.removeEventListener('resize', handleResize)
                document.removeEventListener('fullscreenchange', handleResize)
            }
        }, [initialOffset])

        useEffect(() => {
            if (virtuosoRef.current) {
                ;(virtuosoRef.current as VirtuosoGridHandle).scrollTo({ top: lastScroll.current })
            }
        }, [resizeKey])

        return (
            <div ref={wrapperRef}>
                <VirtuosoGrid
                    key={resizeKey}
                    {...(virtuosoProps as IVirtuosoGridProps)}
                    ref={virtuosoRef as React.RefObject<VirtuosoGridHandle>}
                    useWindowScroll
                    listClassName="virtuoso-grid-list"
                />
            </div>
        )
    }

    if (isHorizontal) {
        return (
            <div ref={wrapperRef}>
                <Virtuoso
                    {...(virtuosoProps as IVirtuosoListProps)}
                    ref={virtuosoRef as React.RefObject<VirtuosoHandle>}
                    horizontalDirection
                    style={{ height: '200px' }}
                    className="continue-watching-row"
                    rangeChanged={onRangeChange}
                />
            </div>
        )
    }

    return (
        <div ref={wrapperRef}>
            <Virtuoso
                {...(virtuosoProps as IVirtuosoListProps)}
                ref={virtuosoRef as React.RefObject<VirtuosoHandle>}
                initialScrollTop={savedOffset || 0}
                useWindowScroll
            />
        </div>
    )
}
