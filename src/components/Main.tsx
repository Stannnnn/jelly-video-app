import { ArrowLeftIcon, ChevronDownIcon } from '@primer/octicons-react'
import { JSX, useEffect, useMemo, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useFilterContext } from '../context/FilterContext/FilterContext'
import { FilterContextProvider } from '../context/FilterContext/FilterContextProvider'
import { useHistoryContext } from '../context/HistoryContext/HistoryContext'
import { usePageTitle } from '../context/PageTitleContext/PageTitleContext'
import { useSidenavContext } from '../context/SidenavContext/SidenavContext'
import { getPageTitle } from '../utils/titleUtils'
import { SortingIcon } from './SvgIcons'

export const Main = (props: Parameters<typeof MainContent>[0]) => {
    return (
        <FilterContextProvider key={(props.content as { name?: string })?.name}>
            <MainContent {...props} />
        </FilterContextProvider>
    )
}

export const MainContent = ({
    content: Content,
    filterType,
}: {
    content: () => JSX.Element
    filterType?: 'movies' | 'favorites'
}) => {
    const { pageTitle } = usePageTitle()
    const { goBack: previousPage } = useHistoryContext()
    const location = useLocation()
    const { toggleSidenav } = useSidenavContext()
    const { filter, setFilter } = useFilterContext()

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
                    {filterType === 'movies' && (
                        <div className="sorting">
                            <div className="filter">
                                <select
                                    onChange={e => setFilter(c => ({ ...c, sort: e.target.value }))}
                                    value={filter.sort}
                                >
                                    <option value="Added">Added</option>
                                    <option value="Released">Released</option>
                                    <option value="Runtime">Runtime</option>
                                    <option value="Random">Random</option>
                                    <option value="Name">Name</option>
                                </select>
                                <div className="icon">
                                    <ChevronDownIcon size={12} />
                                </div>
                            </div>

                            <div
                                className="sort"
                                onClick={() => {
                                    setFilter(c => ({
                                        ...c,
                                        order: c.order === 'Ascending' ? 'Descending' : 'Ascending',
                                    }))
                                }}
                                title={filter.order === 'Ascending' ? 'Ascending' : 'Descending'}
                            >
                                <div className={'icon' + (filter.order === 'Ascending' ? ' active' : '')}>
                                    <SortingIcon width={12} height={12} />
                                </div>
                            </div>
                        </div>
                    )}

                    {filterType === 'favorites' && (
                        <>
                            <div className="sorting links">
                                <div className="filter">
                                    <select
                                        onChange={e => setFilter(c => ({ ...c, kind: e.target.value }))}
                                        value={filter.kind}
                                    >
                                        <option value="Movies">Movies</option>
                                        <option value="Series">Series</option>
                                        <option value="Episodes">Episodes</option>
                                    </select>
                                    <div className="icon">
                                        <ChevronDownIcon size={12} />
                                    </div>
                                </div>
                            </div>

                            {filterType === 'favorites' && (
                                <div className="sorting">
                                    <div className="filter">
                                        <select
                                            onChange={e => setFilter(c => ({ ...c, sort: e.target.value }))}
                                            value={filter.sort}
                                        >
                                            <option value="Added">Added</option>
                                            <option value="Released">Released</option>
                                            <option value="Runtime">Runtime</option>
                                            <option value="Random">Random</option>
                                            <option value="Name">Name</option>
                                        </select>
                                        <div className="icon">
                                            <ChevronDownIcon size={12} />
                                        </div>
                                    </div>
                                    <div
                                        className="sort"
                                        onClick={() => {
                                            setFilter(c => ({
                                                ...c,
                                                order: c.order === 'Ascending' ? 'Descending' : 'Ascending',
                                            }))
                                        }}
                                        title={filter.order === 'Ascending' ? 'Ascending' : 'Descending'}
                                    >
                                        <div className={'icon' + (filter.order === 'Ascending' ? ' active' : '')}>
                                            <SortingIcon width={12} height={12} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    <div className="sidenav_toggle" onClick={toggleSidenav}>
                        <div className="bar"></div>
                        <div className="bar"></div>
                    </div>
                </div>
            </div>
        )
    }, [
        filter.kind,
        filter.order,
        filter.sort,
        filterType,
        location,
        pageTitle,
        previousPage,
        setFilter,
        toggleSidenav,
    ])

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
