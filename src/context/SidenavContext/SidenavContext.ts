import { createContext, useContext } from 'react'
import { ISidenavContext } from './SidenavContextProvider'

export const SidenavContext = createContext<ISidenavContext>({} as ISidenavContext)

export const useSidenavContext = () => useContext(SidenavContext)
