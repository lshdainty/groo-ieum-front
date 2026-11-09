import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'
import { ScrollFog } from '@/shared/ds/scroll-fog'

/**
 * 옛 본문(표 · 타임라인 · 조직도 — 주인 지시서 I-25 · I-24 대기)이 카드보다 넓을 때 카드 안에서 가로로 스크롤하게 감싼다(I-23 K5 · K6).
 * 잘린 쪽은 Scroll Fog 로 흐려져 더 있다는 것이 보이고, 키보드로도 스크롤한다(이름 있는 영역 · tabIndex 0).
 * 긴 글은 말줄임 없이 줄바꿈한다(보이는 내용이 잘리지 않게).
 */
export function WidgetScrollBox({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <ScrollFog
      aria-label={label}
      tabIndex={0}
      className={cn(
        'overflow-x-auto overflow-y-hidden [&_.truncate]:whitespace-normal [&_.truncate]:[overflow:visible] [&_.truncate]:[text-overflow:clip]',
        className,
      )}
    >
      {children}
    </ScrollFog>
  )
}
