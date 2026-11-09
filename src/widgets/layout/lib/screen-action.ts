import { useEffect, useSyncExternalStore } from 'react'

/**
 * 폰 상단 바 오른쪽 글 버튼 하나(top-navigation.md:24 "글 버튼 하나") — 화면이 `useScreenAction` 으로 단다.
 * useScreenTitle 과 같은 길: 화면이 올라와 있는 동안만 등록되고, 바(PhoneFrame)가 읽어 그린다. 데스크톱은 그리지 않는다(제목 줄 동작이 맡는다).
 */
export interface ScreenAction {
  label: string
  onClick: () => void
}

let current: ScreenAction | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function useScreenAction(action: ScreenAction | null): void {
  const label = action?.label ?? null
  const onClick = action?.onClick ?? null
  useEffect(() => {
    if (label == null || onClick == null) return
    const mine: ScreenAction = { label, onClick }
    current = mine
    emit()
    return () => {
      if (current === mine) {
        current = null
        emit()
      }
    }
  }, [label, onClick])
}

export const useCurrentScreenAction = (): ScreenAction | null =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => current,
    () => null,
  )
