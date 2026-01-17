import { useCallback, useEffect, useRef, useState } from 'react'
import { VirtuosoHandle } from 'react-virtuoso'
import { MediaItem } from '../api/jellyfin'
import { MediaList } from './MediaList'
import { ChevronCompactLeftIcon, ChevronCompactRightIcon } from './SvgIcons'

interface HorizontalScrollerProps {
    items: MediaItem[] | undefined
    isLoading: boolean
    type: 'movie' | 'series' | 'episode' | 'collection' | 'mixed' | 'mixedSmall' | 'specials' | 'person'
    itemWidth: number
}

export const HorizontalScroller = ({ items, isLoading, type, itemWidth }: HorizontalScrollerProps) => {
    const virtuosoRef = useRef<VirtuosoHandle>(null)
    const scrollerRef = useRef<HTMLDivElement>(null)
    const targetIndexRef = useRef(0)
    const [arrowState, setArrowState] = useState({ left: false, right: false })

    const updateArrows = useCallback((container: HTMLElement) => {
        const { scrollLeft, scrollWidth, clientWidth } = container
        setArrowState({
            left: scrollLeft > 0,
            right: scrollLeft < scrollWidth - clientWidth - 1,
        })
    }, [])

    useEffect(() => {
        const container = scrollerRef.current?.querySelector('[style*="overflow"]') as HTMLElement
        if (!container) return

        const onScroll = () => {
            setTimeout(() => updateArrows(container), 0)
        }
        const observer = new ResizeObserver(onScroll)

        container.addEventListener('scroll', onScroll, { passive: true })
        observer.observe(container)
        onScroll()

        return () => {
            container.removeEventListener('scroll', onScroll)
            observer.disconnect()
        }
    }, [items, updateArrows])

    const handleScroll = useCallback(
        (direction: 'left' | 'right') => {
            const visibleItems = Math.floor(scrollerRef.current!.offsetWidth / itemWidth)
            const scrollAmount = direction === 'left' ? -visibleItems : visibleItems
            const newIndex = Math.max(0, targetIndexRef.current + scrollAmount)

            targetIndexRef.current = newIndex
            virtuosoRef.current?.scrollToIndex({ index: newIndex, align: 'start', behavior: 'smooth' })
        },
        [itemWidth]
    )

    return (
        <div className="scroller" ref={scrollerRef}>
            <div className={`direction left ${arrowState.left ? 'visible' : ''}`}>
                <div className="icon" onClick={() => handleScroll('left')}>
                    <ChevronCompactLeftIcon width={20} height={20} />
                </div>
            </div>
            <MediaList
                items={items}
                isLoading={isLoading}
                type={type}
                virtuosoType="horizontal"
                virtuosoRef={virtuosoRef}
                onRangeChange={({ startIndex }) => (targetIndexRef.current = startIndex)}
            />
            <div className={`direction right ${arrowState.right ? 'visible' : ''}`}>
                <div className="icon" onClick={() => handleScroll('right')}>
                    <ChevronCompactRightIcon width={20} height={20} />
                </div>
            </div>
        </div>
    )
}
