import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

/**
 * 본문 여백 틀(I-22 D 22) — 화면이 쓴다. 좌우 32(layout-margin) · 아래 56(spacing-screen-bottom). 위 20 은 제목(ds ScreenTitle 의 mt-nav-to-title)이 맡는다.
 *  - 바깥 상자가 좌우 여백을 주고, `medium` 은 안쪽 상자가 폭을 정한다 — 담다 화면 틀과 같은 구조(여백 바깥 · 글 폭 안쪽).
 *  - density `high`: 폭 제한 없음(표 · 달력) / `medium`: 768 ~ 1279 글 폭 최대 720(layout-max-low) · 1280 이상 1040(layout-max-medium), 가운데.
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
        'md:px-(--layout-margin) md:pb-(--spacing-screen-bottom)',
        className
      )}
    >
      {density === 'medium' ? (
        <div className='md:mx-auto md:w-full md:max-w-(--layout-max-low) lg:max-w-(--layout-max-medium)'>
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  )
}

/**
 * 제목 줄 바깥 상자(데스크톱 전용) — ds `ScreenTitle`(description · actions)을 감싼다. 제목 줄 아래 24, 768 미만에서는 그리지 않는다(상단 바가 제목).
 * 제목 줄 위 20(머리 아래, ds ScreenTitle 의 mt-nav-to-title)은 ds 값 그대로 둔다(담다와 같다) — ScreenBody 는 위 여백을 주지 않는다.
 */
export const SCREEN_TITLE_BOX = 'mb-x6 hidden md:block'
