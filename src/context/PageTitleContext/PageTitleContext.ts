import { createContext, useContext } from 'react'
import { IPageTitleContext } from './PageTitleProvider'

export const PageTitleContext = createContext<IPageTitleContext>({} as IPageTitleContext)

export const usePageTitle = () => useContext(PageTitleContext)
