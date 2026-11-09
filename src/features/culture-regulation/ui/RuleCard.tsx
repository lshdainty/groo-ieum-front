import { Card } from '@/shared/ds/card'
import { ImageFrame } from '@/shared/ds/image-frame'
import type { RuleCardData } from '../model/rule-sections'
import { RuleNotes } from './RuleNotes'

/**
 * 데스크톱 규정 카드(F 46) — ds Card(모서리 16 · 1px 테두리) 위에 Image Frame 1:1(카드 폭 그대로 · `lazy` · 장식 `alt=""`),
 * 아래 본문 사방 24: 제목(16 / 22 · 700) · 아래 6 · 설명(14 / 22 · fg-neutral-muted) · 안내 상자. 글을 자르지 않는다.
 * 그림 틀은 `bleed`(모서리 0)로 카드의 모서리 16 이 윗 모서리를 자른다 — 카드 안 둥근 틀 둘이 겹치지 않는다.
 */
export const RuleCard = ({ card }: { card: RuleCardData }) => (
  <Card className='h-full p-0' data-rule-card>
    <ImageFrame src={card.image} alt='' ratio='1:1' bleed loading='lazy' />
    <div className='p-x6'>
      <h3 className='m-0 text-t5 font-bold text-fg-neutral'>{card.title}</h3>
      <p className='m-0 mt-x1_5 text-article-note text-fg-neutral-muted'>{card.body}</p>
      <RuleNotes notes={card.notes} />
    </div>
  </Card>
)
