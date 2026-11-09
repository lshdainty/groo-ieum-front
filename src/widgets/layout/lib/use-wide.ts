import { useSyncExternalStore } from 'react'

/** 1280 이상 — 홈이 2 : 1 두 열이 되는 경계(HB5 B). 미만은 한 칸 */
const QUERY = '(min-width: 1280px)'

const subscribe = (onChange: () => void): (() => void) => {
  const mq = window.matchMedia(QUERY)
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

export const useWide = (): boolean => useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => true)
