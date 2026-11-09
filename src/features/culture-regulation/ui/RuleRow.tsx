import { ImageFrame } from '@/shared/ds/image-frame'
import { ListItem } from '@/shared/ds/list'
import type { RuleCardData } from '../model/rule-sections'
import { RuleNotes } from './RuleNotes'

/**
 * 폰 규정 줄(F 47) — ds List 줄(누르지 않는다): 앞 그림 64(Image Frame 1:1 · 장식) · 제목 · 설명 · 펼친 안내 상자.
 * 줄 위 · 아래 12 · 제목 400 은 List 의 값이다.
 */
export const RuleRow = ({ card }: { card: RuleCardData }) => (
  <ListItem
    align='top'
    prefix={<ImageFrame src={card.image} alt='' ratio='1:1' width={64} loading='lazy' />}
    title={card.title}
    detail={
      <>
        <span className='block text-article-note text-fg-neutral-muted'>{card.body}</span>
        <RuleNotes notes={card.notes} />
      </>
    }
  />
)
