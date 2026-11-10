import { useTranslation } from 'react-i18next'

import { List } from '@/shared/ds/list'
import { useDesktop } from '@/widgets/layout/lib/use-desktop'
import { Band, ScreenBands } from '@/widgets/layout/ui/ScreenBands'
import { ScreenBody, ScreenTitleRow } from '@/widgets/layout/ui/ScreenBody'
import { buildRuleSections } from '../model/rule-sections'
import { RuleCard } from './RuleCard'
import { RuleRow } from './RuleRow'

/**
 * 규정(F 46 ~ 50) — 데스크톱: 제목 줄(h1 + 부제) 아래 묶음 넷, 묶음마다 카드 격자(768 ~ 1279 3열 · 1280 이상 4열 · 칸 사이 24 ·
 * 한 줄 카드 높이는 그 줄에서 가장 긴 카드에 맞춘다). 폰: 상단 바 제목 아래 묶음마다 띠 + List 줄, 부제는 첫 띠 맨 위.
 * 글은 번역 글이라 비지 않고 읽기 요청이 없다 — 실패 화면이 없다(그림이 안 오면 Image Frame 이 대체 그림을 그린다).
 */
export const RuleContent = () => {
  const { t, i18n } = useTranslation('culture')
  const { t: tMenu } = useTranslation('sidebar')
  const desktop = useDesktop()
  const sections = buildRuleSections(t, i18n.language.startsWith('ko') ? '' : ' ')
  const description = t('rule.header.description')

  return (
    <ScreenBody density='medium'>
      <ScreenTitleRow title={tMenu('menu.cultureRegulation')} description={description} />
      {desktop ? (
        <div>
          {sections.map((s) => (
            <section key={s.id} aria-labelledby={`rule-${s.id}`} className='mb-x8'>
              <h2 id={`rule-${s.id}`} className='mt-x2 mb-x3 text-t5 font-bold text-fg-neutral'>
                {s.title}
              </h2>
              <div className='grid grid-cols-3 gap-x6 lg:grid-cols-4'>
                {s.cards.map((c) => (
                  <RuleCard key={c.id} card={c} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <ScreenBands>
          {sections.map((s, i) => (
            <Band
              key={s.id}
              title={s.title}
              body='list'
              leading={i === 0 ? <p className='m-0 text-article-note text-fg-neutral-muted'>{description}</p> : undefined}
            >
              <List aria-label={s.title}>
                {s.cards.map((c) => (
                  <RuleRow key={c.id} card={c} />
                ))}
              </List>
            </Band>
          ))}
        </ScreenBands>
      )}
    </ScreenBody>
  )
}
