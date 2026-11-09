import { useEffect, useRef, useState } from 'react'
import { GripVertical } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/shared/lib/cn'
import { claimFailure, writeFailureKey } from '@/shared/api/failure'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { BottomSheet, BottomSheetBody, BottomSheetContent, BottomSheetFooter } from '@/shared/ds/bottom-sheet'
import { Button } from '@/shared/ds/button'
import { Callout } from '@/shared/ds/callout'
import { List, ListHeader, ListItem } from '@/shared/ds/list'
import { SidePanel, SidePanelBody, SidePanelContent, SidePanelFooter } from '@/shared/ds/side-panel'
import { Switchmark } from '@/shared/ds/switch'
import { useBeforeUnloadWhile } from '@/shared/lib/before-unload'
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
  const update = useUpdateDashboardMutation()
  const dirty = !sameOrder(draft, visible)
  const hidden = hiddenOf(draft, availableIds)

  // 새로 고침 · 탭 닫기 · 주소창 이동 전 브라우저 확인(Bottom Sheet 는 스스로 걸지만 Side Panel 은 걸지 않는다 — 둘 다 걸어도 개수로 센다)
  useBeforeUnloadWhile(open && (dirty || saving))
  // 켜고 끈 줄은 다른 묶음으로 옮겨 가므로 그 줄 스위치로 초점을 따라 보낸다
  const focusSwitch = useRef<string | null>(null)
  useEffect(() => {
    const id = focusSwitch.current
    if (!id) return
    focusSwitch.current = null
    document.querySelector<HTMLElement>(`[data-home-edit] [data-edit-row="${id}"] [role=switch]`)?.focus({ preventScroll: true })
  }, [draft])
  const toggle = (id: string, on: boolean) => {
    focusSwitch.current = id
    setDraft((cur) => toggleWidget(cur, id, on))
  }

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
      {/* 목록은 본문 좌우 여백 없이 붙인다 — 줄 안쪽 24 가 제목과 같은 선에 서게(본문 24 + 줄 24 가 겹치지 않게) */}
      <div className='-mx-x6'>
      <ListHeader variant='mediumWeak' as='h3'>
        {t('editPanel.visibleHeader')}
      </ListHeader>
      <ReorderList draft={draft} nameOf={nameOf} onMove={move} onMoveTo={(id, to) => setDraft((cur) => moveWidgetTo(cur, id, to))} onToggle={toggle} />
      <ListHeader variant='mediumWeak' as='h3'>
        {t('editPanel.hiddenHeader')}
      </ListHeader>
      <List aria-label={t('editPanel.hiddenHeader')} data-edit-hidden>
        {hidden.map((id) => (
          <ListItem
            key={id}
            data-edit-row={id}
            title={nameOf(id)}
            suffix={<Switchmark checked={false} onCheckedChange={() => toggle(id, true)} aria-label={nameOf(id)} />}
          />
        ))}
      </List>
      </div>
      <p role='status' aria-live='polite' className='sr-only' data-edit-live>
        {announce}
      </p>
    </>
  )
  const reset = () => setDraft(defaultVisible(availableIds))
  const resetButton = (
    <Button variant={wide ? 'ghost' : 'neutralWeak'} ghostColor={wide ? 'neutralMuted' : undefined} onClick={reset} data-edit-reset>
      {t('editPanel.reset')}
    </Button>
  )

  // 닫기는 표면이 묻는다 — dirty · busy 를 표면에 넘기면 Esc · 딤 · 뒤로 가기 · [취소] 가 모두 한 자리에서 "작성한 내용이 사라져요" 를 묻는다.
  // 뒤로 가기 → [계속 작성] → 뒤로 가기 도 다시 묻는다(표면이 칸을 다시 쌓는다). onOpenChange(false) 는 확인 뒤에만 온다
  if (wide) {
    return (
      <SidePanel open={open} onOpenChange={onOpenChange} form dirty={dirty}>
        <SidePanelContent size='small' title={t('edit')} description={t('editPanel.description')} data-home-edit>
          <SidePanelBody scrollFog>{content}</SidePanelBody>
          <SidePanelFooter className='justify-between'>
            {resetButton}
            <span className='flex items-center gap-x2'>
              <DialogPrimitive.Close asChild>
                <Button variant='neutralWeak' disabled={saving}>
                  {tc('cancel')}
                </Button>
              </DialogPrimitive.Close>
              <Button loading={saving} onClick={() => void save()}>
                {tc('save')}
              </Button>
            </span>
          </SidePanelFooter>
        </SidePanelContent>
      </SidePanel>
    )
  }
  // 폰 시트의 입력 폼은 위 닫기(✕) + 바닥 [저장]이고 닫기와 취소를 함께 두지 않는다 — 보조(처음 모양으로)는 왼쪽, 주 버튼은 오른쪽에 반씩(bottom-sheet.md)
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} form dirty={dirty} busy={saving}>
      <BottomSheetContent title={t('edit')} description={t('editPanel.description')} data-home-edit>
        <BottomSheetBody>{content}</BottomSheetBody>
        <BottomSheetFooter>
          {resetButton}
          <Button loading={saving} onClick={() => void save()}>
            {tc('save')}
          </Button>
        </BottomSheetFooter>
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

  // 끄는 줄은 빼고 이웃 줄의 가운데와만 견준다 — 자기 줄을 포함하면 1px 만 가도 자리가 바뀌고 떨림에 ABCD ↔ BACD 가 반복된다.
  // 끄는 줄 위쪽 이웃 가운데보다 위로 가야 앞으로, 아래쪽 이웃 가운데를 넘어야 뒤로 간다(반 줄 넘겨야 바뀐다)
  const indexAt = (y: number, dragId: string): number => {
    const others = [...(listRef.current?.querySelectorAll<HTMLElement>('[data-edit-row]') ?? [])].filter((r) => r.dataset.editRow !== dragId)
    let idx = 0
    for (const r of others) {
      const b = r.getBoundingClientRect()
      if (y > b.top + b.height / 2) idx += 1
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
              className='-my-x1_5 -ml-x2_5 flex size-11 shrink-0 cursor-grab touch-none items-center justify-center rounded-r2 text-fg-neutral-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus-ring active:cursor-grabbing'
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
                const to = indexAt(e.clientY, id)
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
