import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'
import { ScreenTitle } from '@/shared/ds/top-navigation'

/**
 * 본문 여백 틀(I-22 D 22) — 화면이 쓴다. 위 32 · 좌우 32(layout-margin) · 아래 56(spacing-screen-bottom).
 *  - density `high`: 폭 제한 없음(표 · 달력) / `medium`: 768 ~ 1279 최대 720(layout-max-low) · 1280 이상 1040(layout-max-medium), 가운데.
 *  - 768 미만은 여백 0 — 띠 화면이라 화면이 띠를 놓는다.
 * 옛 화면은 아직 쓰지 않는다(자기 여백 · 자기 h1 그대로) — I-23 ~ I-25 가 화면마다 옮긴다. 화면별 밀도는 I-22 D 25 표.
 */
export function ScreenBody({
  density = 'high',
  className,
  children,
}: {
  density?: 'high' | 'medium'
  className?: string
  children: ReactNode
}) {
  return (
    <div
      data-density={density}
      className={cn(
        'md:px-(--layout-margin) md:pb-(--spacing-screen-bottom) md:pt-(--layout-margin)',
        density === 'medium' &&
          'md:mx-auto md:w-full md:max-w-(--layout-max-low) lg:max-w-(--layout-max-medium)',
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * 제목 줄(데스크톱 전용) — h1 26 / 35 · 700 + 아래 설명 16/22 · 400 · fg-neutral-muted(위 4, top-navigation.md:216) + 오른쪽 동작 하나(Button small neutralOutline 또는 Select).
 * 제목 줄 아래 24. 768 미만에서는 그리지 않는다 — 상단 바가 제목이다.
 */
export function ScreenTitleRow({
  title,
  description,
  action,
}: {
  title: string
  description?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className='mb-x6 hidden items-center justify-between gap-x4 md:flex'>
      <div className='min-w-0'>
        <ScreenTitle className='m-0'>{title}</ScreenTitle>
        {description != null && <p className='mt-x1 mb-0 text-t5 font-normal text-fg-neutral-muted'>{description}</p>}
      </div>
      {action != null && <div className='flex shrink-0 items-center'>{action}</div>}
    </div>
  )
}
