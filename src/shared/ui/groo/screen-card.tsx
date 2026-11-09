import type { ReactNode } from 'react'

import { Card, CardHeader, CardTitle } from '@/shared/ds/card'
import { useDesktop } from '@/widgets/layout/lib/use-desktop'
import { Band } from '@/widgets/layout/ui/ScreenBands'

/**
 * 목록 구역 하나 — 데스크톱(768 이상)은 카드 머리 + 표 · List(가장자리까지), 폰은 흰 면 한 장(띠)에 같은 머리와 List.
 * 머리(제목 + 오른쪽 동작)는 늘 그리고 내용 자리만 기다린다. leading 은 폰 첫 줄(국가 · 연도 같은 조절 줄)이다.
 */
export function ScreenCard({
  title,
  action,
  leading,
  children,
}: {
  title: string
  action?: ReactNode
  leading?: ReactNode
  children: ReactNode
}) {
  const desktop = useDesktop()
  if (desktop) {
    return (
      <Card body='list'>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {action}
        </CardHeader>
        {children}
      </Card>
    )
  }
  return (
    <Band title={title} action={action} leading={leading} body='list'>
      {children}
    </Band>
  )
}
