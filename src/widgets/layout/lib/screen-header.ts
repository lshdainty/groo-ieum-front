import { useEffect, useSyncExternalStore, type ReactNode } from 'react'

/**
 * 폰 상단 바를 화면이 잠깐 바꾼다 — 한 화면 안에서 "목록 → 상세" 로 들어갈 때(부서 배치: 나무 → 그 부서) 쓴다.
 * useScreenAction 과 같은 길: 화면이 올라와 있는 동안만 등록되고, 바(PhoneFrame)가 읽어 그린다. 데스크톱은 그리지 않는다.
 *  - title: 메뉴 이름 대신 쓰는 제목(부서 한글 이름)
 *  - onBack: 있으면 ☰ 대신 ← 이고 이 동작을 한다(주소의 `?dept=` 를 걷는다)
 *  - action: 오른쪽 아이콘 단추 하나(이름 필수 — "사람 추가")
 */
export interface ScreenHeader {
  title?: string
  onBack?: () => void
  action?: { label: string; icon: ReactNode; onClick: () => void }
}

let current: ScreenHeader | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function useScreenHeader(header: ScreenHeader | null): void {
  const title = header?.title
  const onBack = header?.onBack
  const label = header?.action?.label
  const icon = header?.action?.icon
  const onAction = header?.action?.onClick
  const active = header != null
  useEffect(() => {
    if (!active) return
    const mine: ScreenHeader = {
      title,
      onBack,
      action: label != null && icon != null && onAction != null ? { label, icon, onClick: onAction } : undefined,
    }
    current = mine
    emit()
    return () => {
      if (current === mine) {
        current = null
        emit()
      }
    }
  }, [active, title, onBack, label, icon, onAction])
}

export const useCurrentScreenHeader = (): ScreenHeader | null =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => current,
    () => null,
  )
