import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Card, CardAction, CardHeader, CardTitle } from '@/shared/ds/card'
import { usePermission } from '@/entities/session'
import { useDesktop } from '@/widgets/layout/lib/use-desktop'
import { useLinkClick } from '@/widgets/layout/lib/use-link-click'
import { Band } from '@/widgets/layout/ui/ScreenBands'
import { widgetOf } from '@/features/dashboard/lib/widgets'

/**
 * 위젯 하나의 틀(I-23 B 9) — 데스크톱(768 이상)은 카드, 폰은 띠. 머리는 카드 머리(제목 16 / 22 · 700 + 오른쪽 "전체 보기" 글 버튼)이고
 * 머리 아래 선 · 안쪽 고정 높이 · 끌기 손잡이는 없다 — 높이는 내용만큼. "전체 보기" 는 목적지 화면을 볼 권한이 있을 때만 그린다.
 * body "list" 는 표 · List 를 가장자리까지 담는다. 머리는 늘 그리고 내용 자리만 기다린다(U).
 */
export function WidgetFrame({
  id,
  body = 'content',
  children,
}: {
  id: string
  body?: 'content' | 'list'
  children: ReactNode
}) {
  const { t } = useTranslation('dashboard')
  const desktop = useDesktop()
  const { hasAnyPermission } = usePermission()
  const linkClick = useLinkClick()
  const widget = widgetOf(id)
  if (!widget) return null
  const title = t(widget.labelKey)
  const seeAll = widget.seeAll
  const action =
    seeAll && hasAnyPermission([...seeAll.permissions]) ? (
      <CardAction href={seeAll.path} onClick={linkClick(seeAll.path)} aria-label={t('seeAllOf', { title })}>
        {t('seeAll')}
      </CardAction>
    ) : undefined

  if (desktop) {
    return (
      <Card body={body} data-widget={id}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {action}
        </CardHeader>
        {children}
      </Card>
    )
  }
  return (
    <Band title={title} action={action} body={body} data-widget={id}>
      {children}
    </Band>
  )
}
