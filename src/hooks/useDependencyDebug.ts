/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from 'react'

export const useDependencyDebug = (deps: any[], name = 'deps') => {
    const prev = useRef<any[]>([])

    useEffect(() => {
        deps.forEach((dep, i) => {
            if (dep !== prev.current[i]) {
                console.info(`[${name}] Dependency[${i}] changed`, {
                    prev: prev.current[i],
                    next: dep,
                })
            }
        })
        prev.current = deps
    }, deps)
}
