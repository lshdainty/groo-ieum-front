import type { RuleNote } from '../model/rule-sections'

/**
 * 설명 아래에 늘 펼친 안내 상자(F 48) — 옅은 상자 하나(모서리 radius-r2_5 · bg-neutral-weak · 안 위아래 8 · 좌우 12 · 14 / fg-neutral).
 * 안내 이름(12 · fg-neutral-subtle) + 그 안내 줄들. 안내가 둘인 카드는 한 상자에 묶음 둘. 안내가 없으면 그리지 않는다.
 * 줄 안에 쓰는 요소는 span(block)이다 — List 줄 설명(span) 안에도 들어간다.
 */
export const RuleNotes = ({ notes }: { notes: RuleNote[] }) => {
  if (notes.length === 0) return null
  return (
    <span data-rule-notes className='mt-x2 block rounded-r2_5 bg-bg-neutral-weak px-x3 py-x2 text-t3 text-fg-neutral'>
      {notes.map((n, i) => (
        <span key={n.name} className={i > 0 ? 'mt-x2 block' : 'block'}>
          <span className='block text-t2 text-fg-neutral-subtle'>{n.name}</span>
          {n.lines.map((line) => (
            <span key={line} className='block'>
              {line}
            </span>
          ))}
        </span>
      ))}
    </span>
  )
}
