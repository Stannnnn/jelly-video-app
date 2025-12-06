import { ReactNode, useState } from 'react'
import { PageTitleContext } from './PageTitleContext'

export type IPageTitleContext = ReturnType<typeof useInitialState>

const useInitialState = () => {
    const [pageTitle, setPageTitle] = useState('')

    return {
        pageTitle,
        setPageTitle,
    }
}

export const PageTitleProvider = ({ children }: { children: ReactNode }) => {
    const initialState = useInitialState()

    return <PageTitleContext.Provider value={initialState}>{children}</PageTitleContext.Provider>
}
