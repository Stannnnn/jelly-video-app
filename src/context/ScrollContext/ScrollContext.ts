import { createContext, useContext } from 'react'
import { IScrollContext } from './ScrollContextProvider'

export const ScrollContext = createContext<IScrollContext>({} as IScrollContext)

export const useScrollContext = () => useContext(ScrollContext)
