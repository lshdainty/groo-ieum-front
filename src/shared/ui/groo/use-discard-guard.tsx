import { useRef } from 'react'

import { useLeaveConfirm } from '@/shared/ds/alert-dialog'

/**
 * 바뀐 값이 있는 채 다른 곳으로 가려 할 때 "작성한 내용이 사라져요" 를 묻는다(ds 이탈 확인 그대로).
 * `guard(action)` — 바뀐 값이 없으면 바로 action, 있으면 묻고 [나가기] 일 때 action. `node` 를 화면 어딘가에 그린다.
 */
export function useDiscardGuard(dirty: boolean) {
  const pending = useRef<(() => void) | null>(null)
  const contentRef = useRef<HTMLElement | null>(null)
  const { request, node } = useLeaveConfirm({ dirty, leave: () => pending.current?.(), contentRef })
  const guard = (action: () => void) => {
    pending.current = action
    request()
  }
  return { guard, node }
}
