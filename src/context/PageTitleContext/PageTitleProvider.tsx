import { ReactNode, useEffect, useState } from 'react'
import { PageTitleContext } from './PageTitleContext'

export type IPageTitleContext = ReturnType<typeof useInitialState>

const useInitialState = ({ pageTitle: initialPageTitle }: { pageTitle?: string }) => {
    const [pageTitle, setPageTitle] = useState(initialPageTitle)

    useEffect(() => {
        setPageTitle(initialPageTitle)
    }, [initialPageTitle])

    useEffect(() => {
        document.title = [pageTitle, 'Jelly Video App'].filter(Boolean).join(' - ')
    }, [pageTitle])

    return {
        pageTitle,
        setPageTitle,
    }
}

export const PageTitleProvider = ({ pageTitle, children }: { pageTitle?: string; children: ReactNode }) => {
    const initialState = useInitialState({ pageTitle })

    return <PageTitleContext.Provider value={initialState}>{children}</PageTitleContext.Provider>
}
