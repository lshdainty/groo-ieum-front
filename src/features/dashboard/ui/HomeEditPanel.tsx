import { useEffect, useRef, useState } from 'react'
import { GripVertical } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/shared/lib/cn'
import { claimFailure, writeFailureKey } from '@/shared/api/failure'
import { useLeaveConfirm } from '@/shared/ds/alert-dialog'
import { BottomSheet, BottomSheetBody, BottomSheetContent, BottomSheetFooter } from '@/shared/ds/bottom-sheet'
import { Button } from '@/shared/ds/button'
import { Callout } from '@/shared/ds/callout'
import { List, ListHeader, ListItem } from '@/shared/ds/list'
import { SidePanel, SidePanelBody, SidePanelContent, SidePanelFooter } from '@/shared/ds/side-panel'
import { Switchmark } from '@/shared/ds/switch'
import { useUpdateDashboardMutation } from '@/entities/user'
import { useWide } from '@/widgets/layout/lib/use-wide'
import { defaultVisible, hiddenOf, moveWidget, moveWidgetTo, sameOrder, serializeHomeWidgets, toggleWidget } from '@/features/dashboard/lib/home-edit'
import { widgetOf } from '@/features/dashboard/lib/widgets'

interface HomeEditPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  /** 지금 홈에 보이는 위젯(저장값을 읽은 차례) */
  visible: string[]
  /** 저장값이 켜 둔 전부 — 권한 밖 id 를 저장에서 지우지 않으려고 */
  stored: string[]
  /** 이 사람이 볼 수 있는 위젯 */
  availableIds: string[]
}

/**
 * 홈 편집(I-23 C 13 ~ 17 · overrides "홈 편집 위젯 순서") — 1280 이상 오른쪽 Side Panel 480 · 미만 Bottom Sheet. 목록 하나에서 켜고 끄고(줄 끝 Switch),
 * 차례를 바꾸고(앞 끌기 손잡이 — 끌거나 손잡이에서 ↑ ↓, 옮길 때마다 "{위젯} {n}번째로 옮겼어요."), [저장] 한 번. 줄 ⋮ 는 없다.
 * 바뀐 채 [취소] · Esc · 딤 · 뒤로 가기는 "작성한 내용이 사라져요" 를 묻는다. 저장 실패는 맨 위 Callout, 저장 중에는 [저장] 로딩 + 중복 눌림 막음.
 */
export const HomeEditPanel = ({ sessionKey, ...props }: HomeEditPanelProps & { sessionKey: number }) => {
  const wide = useWide()
  // 열 때마다 새 초안으로 — 닫을 때는 같은 표면이 남아 닫힘 모션 · 초점 복귀를 ds 가 한다
  return <HomeEditSurface key={sessionKey} wide={wide} {...props} />
}

const HomeEditSurface = ({ wide, open, onOpenChange, userId, visible, stored, availableIds }: HomeEditPanelProps & { wide: boolean }) => {
  const { t } = useTranslation('dashboard')
  const { t: tc } = useTranslation('common')
  const [draft, setDraft] = useState<string[]>(visible)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [announce, setAnnounce] = useState('')
  const contentRef = useRef<HTMLDivElement>(null)
  const update = useUpdateDashboardMutation()
  const dirty = !sameOrder(draft, visible)
  const hidden = hiddenOf(draft, availableIds)

  const close = () => onOpenChange(false)
  const leave = useLeaveConfirm({ dirty, contentRef, leave: close, busy: saving })

  const nameOf = (id: string) => {
    const w = widgetOf(id)
    return w ? t(w.labelKey) : id
  }

  const move = (id: string, delta: -1 | 1) => {
    const next = moveWidget(draft, id, delta)
    if (sameOrder(next, draft)) return
    setDraft(next)
    setAnnounce(t('editPanel.moved', { name: nameOf(id), n: next.indexOf(id) + 1 }))
  }

  const save = async () => {
    if (saving) return
    setSaving(true)
    setError(null)
    try {
      await update.mutateAsync({ userId, data: { dashboard: serializeHomeWidgets(draft, stored, availableIds) } })
      onOpenChange(false)
    } catch (e) {
      claimFailure(e)
      const key = writeFailureKey(e)
      if (key !== null) setError(key === 'failure.write' ? t('saveError') : tc(key))
    } finally {
      setSaving(false)
    }
  }

  const content = (
    <>
      {error && (
        <Callout tone='critical' role='alert' className='mb-x4' data-save-failure>
          {error}
        </Callout>
      )}
      <ListHeader variant='mediumWeak' as='h3'>
        {t('editPanel.visibleHeader')}
      </ListHeader>
      <ReorderList draft={draft} nameOf={nameOf} onMove={move} onMoveTo={(id, to) => setDraft((cur) => moveWidgetTo(cur, id, to))} onToggle={(id, on) => setDraft((cur) => toggleWidget(cur, id, on))} />
      <ListHeader variant='mediumWeak' as='h3'>
        {t('editPanel.hiddenHeader')}
      </ListHeader>
      <List aria-label={t('editPanel.hiddenHeader')} data-edit-hidden>
        {hidden.map((id) => (
          <ListItem
            key={id}
            data-edit-row={id}
            title={nameOf(id)}
            suffix={<Switchmark checked={false} onCheckedChange={() => setDraft((cur) => toggleWidget(cur, id, true))} aria-label={nameOf(id)} />}
          />
        ))}
      </List>
      <p role='status' aria-live='polite' className='sr-only' data-edit-live>
        {announce}
      </p>
    </>
  )
  const reset = () => setDraft(defaultVisible(availableIds))
  const resetButton = (
    <Button variant='ghost' ghostColor='neutralMuted' size={wide ? 'small' : 'medium'} onClick={reset} data-edit-reset>
      {t('editPanel.reset')}
    </Button>
  )

  if (wide) {
    return (
      <SidePanel open={open} onOpenChange={(next) => (next ? onOpenChange(true) : leave.request())} form>
        <SidePanelContent ref={contentRef} size='small' title={t('edit')} description={t('editPanel.description')} data-home-edit>
          <SidePanelBody scrollFog>{content}</SidePanelBody>
          <SidePanelFooter className='justify-between'>
            {resetButton}
            <span className='flex items-center gap-x2'>
              <Button variant='neutralWeak' onClick={() => leave.request()}>
                {tc('cancel')}
              </Button>
              <Button loading={saving} onClick={() => void save()}>
                {tc('save')}
              </Button>
            </span>
          </SidePanelFooter>
          {leave.node}
        </SidePanelContent>
      </SidePanel>
    )
  }
  return (
    <BottomSheet open={open} onOpenChange={(next) => (next ? onOpenChange(true) : leave.request())} form busy={saving}>
      <BottomSheetContent ref={contentRef} title={t('edit')} description={t('editPanel.description')} data-home-edit>
        <BottomSheetBody>
          {content}
          <div className='flex justify-center pt-x2'>{resetButton}</div>
        </BottomSheetBody>
        <BottomSheetFooter>
          <Button variant='neutralWeak' onClick={() => leave.request()}>
            {tc('cancel')}
          </Button>
          <Button loading={saving} onClick={() => void save()}>
            {tc('save')}
          </Button>
        </BottomSheetFooter>
        {leave.node}
      </BottomSheetContent>
    </BottomSheet>
  )
}

/** 보이는 위젯 목록 — 줄 앞 끌기 손잡이(포인터로 끌기 · 손잡이에서 ↑ ↓), 줄 끝 Switch(켬). 줄 자체는 누르지 않는다 */
const ReorderList = ({
  draft,
  nameOf,
  onMove,
  onMoveTo,
  onToggle,
}: {
  draft: string[]
  nameOf: (id: string) => string
  onMove: (id: string, delta: -1 | 1) => void
  onMoveTo: (id: string, to: number) => void
  onToggle: (id: string, on: boolean) => void
}) => {
  const { t } = useTranslation('dashboard')
  const listRef = useRef<HTMLUListElement>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  // 옮긴 뒤에도 초점이 그 손잡이에 남는다(줄이 다시 놓여 초점이 풀리지 않게)
  const focusId = useRef<string | null>(null)
  useEffect(() => {
    if (!focusId.current) return
    listRef.current?.querySelector<HTMLElement>(`[data-grip="${focusId.current}"]`)?.focus({ preventScroll: true })
  }, [draft])

  const indexAt = (y: number): number => {
    const rows = [...(listRef.current?.querySelectorAll<HTMLElement>('[data-edit-row]') ?? [])]
    let idx = rows.length - 1
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i].getBoundingClientRect()
      if (y < r.top + r.height / 2) {
        idx = i
        break
      }
    }
    return idx
  }

  return (
    <List ref={listRef} aria-label={t('editPanel.visibleHeader')} data-edit-visible>
      {draft.map((id, index) => (
        <ListItem
          key={id}
          data-edit-row={id}
          data-dragging={dragging === id || undefined}
          className={cn(dragging === id && 'bg-bg-neutral-weak')}
          prefix={
            <button
              type='button'
              data-grip={id}
              aria-label={t('editPanel.grip', { name: nameOf(id) })}
              aria-description={t('editPanel.gripHint')}
              className='flex size-x8 shrink-0 cursor-grab touch-none items-center justify-center rounded-r2 text-fg-neutral-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus-ring active:cursor-grabbing'
              onFocus={() => (focusId.current = id)}
              onBlur={() => {
                if (focusId.current === id) focusId.current = null
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                  e.preventDefault()
                  focusId.current = id
                  onMove(id, e.key === 'ArrowUp' ? -1 : 1)
                }
              }}
              onPointerDown={(e) => {
                if (e.pointerType === 'mouse' && e.button !== 0) return
                e.currentTarget.setPointerCapture(e.pointerId)
                setDragging(id)
              }}
              onPointerMove={(e) => {
                if (dragging !== id) return
                const to = indexAt(e.clientY)
                if (to !== draft.indexOf(id)) onMoveTo(id, to)
              }}
              onPointerUp={() => setDragging(null)}
              onPointerCancel={() => setDragging(null)}
            >
              <GripVertical aria-hidden className='size-x5' />
            </button>
          }
          title={nameOf(id)}
          suffix={<Switchmark checked onCheckedChange={(on) => onToggle(id, on)} aria-label={nameOf(id)} />}
          data-first={index === 0 || undefined}
        />
      ))}
    </List>
  )
}
