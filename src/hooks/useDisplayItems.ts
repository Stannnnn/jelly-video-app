import { useEffect, useMemo, useRef } from 'react'
import { MediaItem } from '../api/jellyfin'

export const useDisplayItems = (tracks: MediaItem[], isLoading: boolean) => {
    const displayItems = useMemo(() => {
        if (isLoading) {
            return [...tracks, ...Array(6).fill({ isPlaceholder: true })]
        } else {
            return tracks
        }
    }, [tracks, isLoading])

    const sizeMap = useRef<{ [index: number]: number }>({})
    const rowRefs = useRef<(HTMLElement | null)[]>([])
    const resizeObservers = useRef<ResizeObserver[]>([])

    const setSize = (index: number, height: number) => {
        sizeMap.current = { ...sizeMap.current, [index]: height }
    }

    useEffect(() => {
        const handleResize = () => {
            measureInitialHeights()
        }

        const setupResizeObservers = () => {
            resizeObservers.current = rowRefs.current.map((ref, index) => {
                const observer = new ResizeObserver(() => {
                    if (ref) {
                        const originalHeight = ref.style.height
                        ref.style.height = 'auto'
                        const height = ref.getBoundingClientRect().height
                        ref.style.height = originalHeight || `${height}px`
                        if (height !== sizeMap.current[index]) {
                            setSize(index, height)
                        }
                    }
                })
                if (ref) observer.observe(ref)
                return observer
            })
        }

        const cleanupResizeObservers = () => {
            resizeObservers.current.forEach(observer => observer.disconnect())
            resizeObservers.current = []
        }

        const measureInitialHeights = () => {
            rowRefs.current.forEach((ref, index) => {
                if (ref) {
                    const originalHeight = ref.style.height
                    ref.style.height = 'auto'
                    const height = ref.getBoundingClientRect().height
                    ref.style.height = originalHeight || `${height}px`
                    if (height !== sizeMap.current[index]) {
                        setSize(index, height)
                    }
                }
            })
        }

        rowRefs.current = displayItems.map(() => null)
        cleanupResizeObservers()
        measureInitialHeights()
        setupResizeObservers()
        document.body.style.overflowY = 'auto'
        window.addEventListener('resize', handleResize)

        return () => {
            cleanupResizeObservers()
            window.removeEventListener('resize', handleResize)
        }
    }, [displayItems])

    return {
        displayItems,
        setRowRefs: (index: number, el: HTMLElement | null) => {
            rowRefs.current[index] = el
        },
    }
}
