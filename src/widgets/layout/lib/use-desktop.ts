import { useSyncExternalStore } from 'react'

/** 768 이상 — 사이드바(데스크톱 틀) · 미만 — 상단 바 + ☰ 옆 패널(폰 틀). ds Side Navigation · Side Panel 과 같은 경계 */
const QUERY = '(min-width: 768px)'

const subscribe = (onChange: () => void): (() => void) => {
  const mq = window.matchMedia(QUERY)
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

export const useDesktop = (): boolean => useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => true)
