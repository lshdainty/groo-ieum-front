import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import type { NoticeListResp } from '@/entities/notice'
import { Badge } from '@/shared/ds/badge'
import { Button, ResponsivePair } from '@/shared/ds/button'
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
} from '@/shared/ds/dialog'
import { useWideSurface } from '@/shared/ds/overlay'

interface NoticePopupProps {
  open: boolean
  /** 지금 보는 공지(목록 항목 — 제목 · 종류는 상세를 받기 전에도 있다) */
  notice: NoticeListResp
  /** 공지 본문 — 상세를 받는 동안은 없다 */
  content?: string
  /** 0부터 센 차례와 전체 수 — 둘 이상일 때만 넘김 줄을 그린다 */
  index: number
  total: number
  onPrev: () => void
  onNext: () => void
  /** 이번에만 닫는다(다음 진입에 다시 뜬다) — 바깥 · Esc · (시트) 끌어내리기도 같다 */
  onClose: () => void
  /** 오늘은 그만 본다 — 이 기기 · 모든 공지 */
  onHideToday: () => void
}

/**
 * 로그인 뒤 공지 팝업 — 창 하나에서 ‹ › 로 넘겨 보는 한 표면(H-A9 A + HN3 A).
 * 1280 이상 Dialog medium 480 · 미만 Bottom Sheet(Responsive Dialog, 조회 · 안내). 머리 닫기 버튼을 두지 않고 바닥 [닫기] 가 닫는다
 * (dialog.md "닫기 버튼과 취소 — 하나만"). 본문 꼴은 종류 Badge → 제목 → 본문. 시트는 머리가 늘 제목이라 제목을 머리에 두고
 * 종류 Badge 를 본문 맨 위에 둔다(Q-i22-3).
 */
export const NoticePopup = ({ open, notice, content, index, total, onPrev, onNext, onClose, onHideToday }: NoticePopupProps) => {
  const { t } = useTranslation('notice')
  const { t: tc } = useTranslation('common')
  const wide = useWideSurface()
  const bodyRef = useRef<HTMLDivElement>(null)

  // 넘기면 본문 맨 위로
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 })
  }, [notice.notice_id])

  const pinned = notice.is_pinned === 'Y'
  const kind = (
    <Badge tone={pinned ? 'brand' : 'neutral'}>{pinned ? t('pinned') : notice.notice_type_name}</Badge>
  )

  const nav =
    total > 1 ? (
      <div
        data-slot='notice-popup-nav'
        className={wide ? 'mr-auto flex items-center gap-x2' : 'flex items-center justify-center gap-x2'}
      >
        <Button variant='ghost' size='medium' layout='iconOnly' aria-label={t('popup.prev')} disabled={index === 0} onClick={onPrev}>
          <ChevronLeft />
        </Button>
        <span aria-live='polite' className='min-w-[3.5rem] text-center text-t4 text-fg-neutral-muted'>
          {t('popup.position', { current: index + 1, total })}
        </span>
        <Button variant='ghost' size='medium' layout='iconOnly' aria-label={t('popup.next')} disabled={index === total - 1} onClick={onNext}>
          <ChevronRight />
        </Button>
      </div>
    ) : null

  return (
    <ResponsiveDialog open={open} onOpenChange={(next) => !next && onClose()}>
      <ResponsiveDialogContent
        // 대화상자는 머리가 없다 — 제목이 본문 안에 있다. 시트는 머리가 제목이다
        title={wide ? null : notice.title}
        aria-label={wide ? t('popup.label') : undefined}
        showCloseButton={false}
      >
        <ResponsiveDialogBody ref={bodyRef} scrollFog aria-busy={content === undefined || undefined}>
          <article className='flex flex-col gap-x2'>
            {kind}
            {wide && (
              <h2 className='m-0 break-keep text-t8 font-bold text-fg-neutral [overflow-wrap:break-word]'>{notice.title}</h2>
            )}
            <p className='m-0 whitespace-pre-wrap text-article-body text-fg-neutral [overflow-wrap:anywhere]'>{content}</p>
          </article>
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          {wide ? (
            <>
              {nav}
              <Button variant='neutralWeak' onClick={onHideToday}>
                {tc('dontShowToday')}
              </Button>
              <Button variant='neutralSolid' onClick={onClose}>
                {tc('close')}
              </Button>
            </>
          ) : (
            <div className='flex flex-col gap-x3'>
              {nav}
              <ResponsivePair>
                <Button variant='neutralWeak' size='large' onClick={onHideToday}>
                  {tc('dontShowToday')}
                </Button>
                <Button variant='neutralSolid' size='large' onClick={onClose}>
                  {tc('close')}
                </Button>
              </ResponsivePair>
            </div>
          )}
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
