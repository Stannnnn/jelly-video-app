import { ReactNode, useState } from 'react'
import { IJellyfinAuth, initJellyfinApi } from '../../api/jellyfin'
import { JellyfinContext } from './JellyfinContext'

export type IJellyfinContext = ReturnType<typeof useInitialState>

const useInitialState = (auth: IJellyfinAuth) => {
    const [api] = useState(initJellyfinApi(auth))

    return { ...api, auth } // Preferably we dont return the auth object here but we need it for legacy functions
}

export const JellyfinContextProvider = ({ children, auth }: { children: ReactNode; auth: IJellyfinAuth }) => {
    const initialState = useInitialState(auth)

    return <JellyfinContext.Provider value={initialState}>{children}</JellyfinContext.Provider>
}
