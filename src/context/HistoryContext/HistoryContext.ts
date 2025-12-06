import { createContext, useContext } from 'react'
import { IHistoryContext } from './HistoryContextProvider'

export const HistoryContext = createContext<IHistoryContext>({} as IHistoryContext)

export const useHistoryContext = () => useContext(HistoryContext)
