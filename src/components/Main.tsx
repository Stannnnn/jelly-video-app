import { ArrowLeftIcon } from '@primer/octicons-react'
import { JSX, useEffect, useMemo, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useHistoryContext } from '../context/HistoryContext/HistoryContext'
import { usePageTitle } from '../context/PageTitleContext/PageTitleContext'
import { useSidenavContext } from '../context/SidenavContext/SidenavContext'
import { getPageTitle } from '../utils/titleUtils'

export const Main = (props: Parameters<typeof MainContent>[0]) => {
    return <MainContent {...props} />
}

export const MainContent = ({
    content: Content,
    filterType,
}: {
    content: () => JSX.Element
    filterType?: 'mediaItems' | 'favorites' | 'kind' | 'mediaItemsPlaylist'
}) => {
    const { pageTitle } = usePageTitle()
    const { goBack: previousPage } = useHistoryContext()
    const location = useLocation()
    const { toggleSidenav } = useSidenavContext()

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' })
    }, [location.pathname])

    const memoHeader = useMemo(() => {
        return (
            <div className="main_header">
                <div className="primary">
                    <div onClick={previousPage} className="return_icon" title="Back">
                        <ArrowLeftIcon size={16}></ArrowLeftIcon>
                    </div>
                    <div className="container">
                        <div className="page_title">
                            <div className="text" title={getPageTitle(pageTitle, location)}>
                                {getPageTitle(pageTitle, location)}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="secondary noSelect">
                    <div className="sidenav_toggle" onClick={toggleSidenav}>
                        <div className="bar"></div>
                        <div className="bar"></div>
                    </div>
                </div>
            </div>
        )
    }, [filterType, location, pageTitle, previousPage, toggleSidenav])

    const memoContent = useMemo(() => {
        return (
            <div className="main_content">
                <Content />
            </div>
        )
    }, [Content])

    return (
        <main className="main">
            {memoHeader}
            {memoContent}
        </main>
    )
}

export const Progressbar = () => {
    const progressRef = useRef<HTMLInputElement>(null)
    const trackRef = useRef<HTMLDivElement>(null)
    const bufferRef = useRef(false)

    return (
        <div className="progress" ref={trackRef}>
            <input
                ref={progressRef}
                type="range"
                id="track-progress"
                name="track-progress"
                step="0.01"
                min="0"
                max={0}
                style={{} as React.CSSProperties}
                onChange={e => {}}
            />
        </div>
    )
}
