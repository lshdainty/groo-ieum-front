import { useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { useTranslation } from 'react-i18next'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ds/alert-dialog'

import { useConfirmFail, type ConfirmKind } from './confirm-fail'

const stop = (e: { stopPropagation: () => void }) => e.stopPropagation()

export interface ConfirmDialogProps {
  /** 제어하는 쪽이 열림을 든다. 없으면 `trigger` 가 연다 */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** 여는 버튼 — 닫으면 초점이 여기로 돌아온다 */
  trigger?: ReactNode
  /** "{대상} {동작}" — 이름은 제목이 아니라 설명 첫 문장에 큰따옴표로 넣는다(alert-dialog.md "글") */
  title: ReactNode
  /** 무엇이 어떻게 되는지 · 되돌릴 수 없다는 사실 — 늘 둔다 */
  description: ReactNode
  /** 확정 단추 글 — 동작 이름. 기본 "삭제" */
  confirmLabel?: string
  /** 취소 단추 글 — 기본 "취소" */
  cancelLabel?: string
  /** 확정의 무게 — 지우기 · 잃기는 criticalSolid(기본) */
  tone?: 'criticalSolid' | 'neutralSolid'
  /** 실패 글의 동사 — 기본 delete */
  kind?: ConfirmKind
  /** 한다 — 끝날 때까지 확정 단추가 로딩이다. 실패하면 던진다(mutateAsync) */
  onConfirm: () => Promise<unknown> | void
  /** 끝난 뒤(열린 채 마친 뒤 닫고 부른다) — 다시 시도가 성공했을 때도 부른다 */
  onDone?: () => void
  /**
   * 닫힌 뒤 초점 — 기본은 연 자리(⋮ 단추)로 돌아간다. 지운 줄의 ⋮ 처럼 연 자리가 사라졌으면 호출처가
   * `e.preventDefault()` 하고 다음 자리로 보낸다(안 하면 초점이 body 로 떨어진다)
   */
  onCloseAutoFocus?: (event: Event) => void
}

/**
 * 지우기 · 취소 확인 한 벌 — ds Alert Dialog(제목 · 설명 · [취소] · [확정] criticalSolid). 같은 동작은 어디서 불러도 같은 글이다.
 * 확정이 끝나기까지 확정 단추가 로딩이고 창은 열려 있다. 실패하면 창을 닫은 뒤 critical Snackbar + [다시 시도](confirm-fail.ts).
 */
export function ConfirmDialog({
  open: openProp,
  onOpenChange,
  trigger,
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone = 'criticalSolid',
  kind = 'delete',
  onConfirm,
  onDone,
  onCloseAutoFocus,
}: ConfirmDialogProps) {
  const { t } = useTranslation('common')
  const fail = useConfirmFail()
  const [innerOpen, setInnerOpen] = useState(false)
  const [running, setRunning] = useState(false)
  const open = openProp ?? innerOpen
  const setOpen = (next: boolean) => {
    if (openProp === undefined) setInnerOpen(next)
    onOpenChange?.(next)
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        // 확정하는 동안은 닫지 않는다
        if (!next && running) return
        setOpen(next)
      }}
    >
      {trigger != null && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      {/* 포털 안 누름은 React 트리로는 이 확인창을 연 부모(줄 · 달력 칸 …)까지 올라간다 — 딤을 눌렀는데 뒤 화면이 반응하지 않게 막는다 */}
      <div className='contents' onClick={stop} onMouseDown={stop} onMouseUp={stop}>
        <AlertDialogContent onCloseAutoFocus={onCloseAutoFocus}>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>{cancelLabel ?? t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant={tone}
              loading={running}
              onClick={async (e) => {
                e.preventDefault()
                setRunning(true)
                try {
                  await onConfirm()
                  setOpen(false)
                  onDone?.()
                } catch (error) {
                  // 창을 다 내린 뒤에 알린다 — 스낵바가 뜨는 순간 확인창이 DOM 에 남아 있지 않게
                  flushSync(() => setOpen(false))
                  fail({ error, kind, retry: onConfirm, onRetried: onDone })
                } finally {
                  setRunning(false)
                }
              }}
            >
              {confirmLabel ?? t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </div>
    </AlertDialog>
  )
}
