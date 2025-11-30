import { ReactNode, useEffect, useState } from 'react'
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom'
import { HistoryContext } from './HistoryContext'

export type IHistoryContext = ReturnType<typeof useInitialState>

const useInitialState = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const navType = useNavigationType()
    const currentLocation = location.pathname + location.search

    const [canGoBackCount, setCanGoBackCount] = useState(0)

    useEffect(() => {
        if (navType === 'PUSH') {
            setCanGoBackCount(prev => prev + 1)
        } else if (navType === 'POP') {
            setCanGoBackCount(prev => Math.max(prev - 1, 0))
        }
    }, [currentLocation, navType])

    const goBack = () => {
        if (canGoBackCount > 0) {
            navigate(-1)
        } else {
            navigate('/', { replace: true })
        }
    }

    return { goBack }
}

export const HistoryContextProvider = ({ children }: { children: ReactNode }) => {
    const initialState = useInitialState()

    return <HistoryContext.Provider value={initialState}>{children}</HistoryContext.Provider>
}
