import type { ReactNode } from 'react'

import { Card, CardHeader, CardTitle } from '@/shared/ds/card'
import { useDesktop } from '@/widgets/layout/lib/use-desktop'
import { Band } from '@/widgets/layout/ui/ScreenBands'

/**
 * 회비 구역 하나 — 데스크톱(768 이상)은 카드, 폰은 띠(흰 면 · 좌우 끝까지, 사이 8 은 ScreenBands 가 둔다).
 * 머리(제목 + 오른쪽 동작)는 늘 그리고 내용 자리만 기다린다(U) — 그래서 구역이 자기 머리를 갖는다.
 * body "list" 는 표 · List 를 가장자리까지 담는다. leading 은 폰 첫 띠 맨 위의 연도 줄(T11).
 */
export function DuesSection({
  title,
  action,
  body = 'content',
  leading,
  children,
}: {
  title: string
  action?: ReactNode
  body?: 'content' | 'list'
  leading?: ReactNode
  children: ReactNode
}) {
  const desktop = useDesktop()
  if (desktop) {
    return (
      <Card body={body}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {action}
        </CardHeader>
        {children}
      </Card>
    )
  }
  return (
    <Band title={title} action={action} body={body} leading={leading}>
      {children}
    </Band>
  )
}
