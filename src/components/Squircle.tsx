import { getSvgPath } from 'figma-squircle'
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react'

// Cache SVG paths for common configurations to avoid recalculating
const pathCache = new Map<string, string>()

const getCachedSvgPath = (width: number, height: number, cornerRadius: number, cornerSmoothing: number) => {
    const cacheKey = `${width}-${height}-${cornerRadius}-${cornerSmoothing}`
    if (!pathCache.has(cacheKey)) {
        const path = getSvgPath({
            width,
            height,
            cornerRadius,
            cornerSmoothing,
        })
        pathCache.set(cacheKey, path)
    }
    return pathCache.get(cacheKey)!
}

interface SquircleProps {
    width: number
    height: number
    cornerRadius?: number
    cornerSmoothing?: number
    useSquircle?: boolean
    isResponsive?: boolean
    className?: string
    children: ReactNode
}

export const Squircle = ({
    width,
    height,
    cornerRadius,
    cornerSmoothing = 0.8,
    useSquircle = true,
    isResponsive = false,
    className,
    children,
}: SquircleProps) => {
    // Tracking dynamic dimensions for responsive behavior
    const [dimensions, setDimensions] = useState({ width, height })
    const ref = useRef<HTMLDivElement>(null)

    // Determine default cornerRadius based on dimensions if not provided
    const effectiveCornerRadius = useMemo(() => {
        if (cornerRadius !== undefined) return cornerRadius
        const size = Math.min(dimensions.width, dimensions.height)
        if (size <= 40) return 6
        if (size <= 46) return 6
        if (size <= 100) return 8
        return size * 0.08
    }, [cornerRadius, dimensions.width, dimensions.height])

    // Compute squircle path only if useSquircle is true
    const svgPath = useMemo(() => {
        if (!useSquircle) return null
        return getCachedSvgPath(dimensions.width, dimensions.height, effectiveCornerRadius, cornerSmoothing)
    }, [dimensions.width, dimensions.height, effectiveCornerRadius, cornerSmoothing, useSquircle])

    // ResizeObserver for responsive squircle
    useEffect(() => {
        const current = ref.current

        if (!isResponsive || !current) return

        const resizeObserver = new ResizeObserver(entries => {
            const { width, height } = entries[0].contentRect
            setDimensions({ width: Math.round(width), height: Math.round(height) })
        })

        resizeObserver.observe(current)

        return () => {
            if (current) resizeObserver.unobserve(current)
        }
    }, [isResponsive])

    return (
        <div
            ref={ref}
            className={className}
            style={{
                width: isResponsive ? '100%' : `${width}px`,
                height: isResponsive ? '100%' : `${height}px`,
                clipPath: svgPath ? `path('${svgPath}')` : undefined,
                borderRadius: !svgPath ? `${effectiveCornerRadius}px` : undefined,
                overflow: 'hidden',
            }}
        >
            {children}
        </div>
    )
}
