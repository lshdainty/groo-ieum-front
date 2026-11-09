import { useState } from 'react'

/**
 * 확인창이 묻는 대상 — 열 때 대상을 잡고, 닫아도 대상을 지우지 않는다(닫히는 100ms 동안 설명 글이 비지 않게).
 * `ask(대상)` 으로 열고 `open` · `onOpenChange` 를 ConfirmDialog 에 넘긴다.
 */
export function useConfirmTarget<T>() {
  const [target, setTarget] = useState<T | null>(null)
  const [open, setOpen] = useState(false)
  return {
    target,
    open,
    ask: (next: T) => {
      setTarget(next)
      setOpen(true)
    },
    onOpenChange: setOpen,
  }
}
