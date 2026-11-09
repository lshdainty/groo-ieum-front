import type { ReactNode } from 'react'
import type { TFunction } from 'i18next'
import { Trans } from 'react-i18next'

/** 카드 · 줄 설명 아래에 늘 펼쳐 두는 안내 — 이름(예전 팝오버의 눌러 여는 글) + 그 안의 줄들 */
export interface RuleNote {
  name: string
  lines: string[]
}

export interface RuleCardData {
  id: string
  /** `/public` 아래 그림 — 장식이라 대체 글이 없다(제목 · 설명이 내용을 말한다) */
  image: string
  title: string
  body: ReactNode
  notes: RuleNote[]
}

export interface RuleSectionData {
  id: string
  title: string
  cards: RuleCardData[]
}

const NB = ' '
/** 눌러 여는 글이었던 낱말 — 굵은 글(700, 밑줄 없음 — 누르는 것처럼 보이지 않게) */
const em = (children: ReactNode): ReactNode => <b className='font-bold'>{children}</b>
/** 낱말 풀이 글은 밑줄 없이 그대로 둔다 */
const noUnderline = <span />

/**
 * 규정 묶음 넷 × 카드 넷(F 46 ~ 49). 글은 지금 번역 글 그대로다 — 짜임만 바꿨다:
 *  - 안내 12곳(팝오버)은 `notes` 로 옮겨 카드 · 줄이 설명 아래에 늘 펼친다.
 *  - "지급 시기"는 굵은 "분기" + 설명 한 번(예전: 분기 낱말로 설명을 나누다 문장 전체가 두 번 찍혔다).
 * `sep` 은 한글에서는 붙이고(조사가 바로 붙는다) 영어에서는 한 칸 둔다.
 */
export const buildRuleSections = (t: TFunction<'culture'>, sep: string): RuleSectionData[] => {
  const img = (n: number, m: number): string => `/rule_${n}_${m}.png`
  const earlyLeave: RuleNote = {
    name: t('rule.culture.earlyLeaveTrigger'),
    lines: [t('rule.culture.earlyLeaveSeoul'), t('rule.culture.earlyLeaveOther')],
  }

  return [
    {
      id: 'vacation',
      title: t('rule.vacation.title'),
      cards: [
        {
          id: 'days',
          image: img(1, 1),
          title: t('rule.vacation.daysTitle'),
          body: <Trans i18nKey='rule.vacation.daysDesc' ns='culture' components={{ b: <b className='font-bold' />, u: noUnderline }} />,
          notes: [],
        },
        {
          id: 'timing',
          image: img(1, 2),
          title: t('rule.vacation.timingTitle'),
          body: (
            <>
              {em(t('rule.vacation.timingTrigger'))}
              {sep}
              {t('rule.vacation.timingDesc')}
            </>
          ),
          notes: [
            {
              name: t('rule.vacation.timingTrigger'),
              lines: [t('rule.vacation.timingQ1'), t('rule.vacation.timingQ2'), t('rule.vacation.timingQ3'), t('rule.vacation.timingQ4')],
            },
          ],
        },
        {
          id: 'special',
          image: img(1, 3),
          title: t('rule.vacation.specialTitle'),
          body: (
            <>
              {em(t('rule.vacation.happyTrigger'))}
              {sep}
              {t('rule.vacation.or')}
              {NB}
              {em(t('rule.vacation.sadTrigger'))}
              {NB}
              {t('rule.vacation.specialDesc')}
            </>
          ),
          notes: [
            { name: t('rule.vacation.happyTrigger'), lines: [t('rule.vacation.happyMarriage'), t('rule.vacation.happyBirth')] },
            { name: t('rule.vacation.sadTrigger'), lines: [t('rule.vacation.sadParents'), t('rule.vacation.sadInLaws')] },
          ],
        },
        {
          id: 'other',
          image: img(1, 4),
          title: t('rule.vacation.otherTitle'),
          body: (
            <>
              🏥{em(t('rule.vacation.healthTrigger'))},{NB}💂‍♂️{em(t('rule.vacation.militaryTrigger'))}
              {NB}
              {t('rule.vacation.otherDesc')}
            </>
          ),
          notes: [
            { name: t('rule.vacation.healthTrigger'), lines: [t('rule.vacation.healthDesc')] },
            { name: t('rule.vacation.militaryTrigger'), lines: [t('rule.vacation.militaryMobilization'), t('rule.vacation.militaryLocal')] },
          ],
        },
      ],
    },
    {
      id: 'attire',
      title: t('rule.attire.title'),
      cards: [
        { id: 'basic', image: img(2, 1), title: t('rule.attire.basicTitle'), body: t('rule.attire.basicDesc'), notes: [] },
        { id: 'meeting', image: img(2, 2), title: t('rule.attire.meetingTitle'), body: t('rule.attire.meetingDesc'), notes: [] },
        {
          id: 'field',
          image: img(2, 3),
          title: t('rule.attire.fieldTitle'),
          body: <Trans i18nKey='rule.attire.fieldDesc' ns='culture' components={{ br: <br /> }} />,
          notes: [],
        },
        {
          id: 'avoid',
          image: img(2, 4),
          title: t('rule.attire.avoidTitle'),
          body: (
            <>
              {t('rule.attire.avoidIntro')}
              {NB}
              {em(t('rule.attire.avoidTrigger'))}
              {sep}
              {t('rule.attire.avoidEnd')}
            </>
          ),
          notes: [
            {
              name: t('rule.attire.avoidTrigger'),
              lines: [t('rule.attire.avoidShirt'), t('rule.attire.avoidSportswear'), t('rule.attire.avoidSlippers')],
            },
          ],
        },
      ],
    },
    {
      id: 'education',
      title: t('rule.education.title'),
      cards: [
        { id: 'selfDev', image: img(3, 1), title: t('rule.education.selfDevTitle'), body: t('rule.education.selfDevDesc'), notes: [] },
        {
          id: 'external',
          image: img(3, 2),
          title: t('rule.education.externalTitle'),
          body: (
            <>
              🧑‍🏫{em(t('rule.education.externalTrigger'))}
              {sep}
              {t('rule.education.externalDesc')}
            </>
          ),
          notes: [{ name: t('rule.education.externalTrigger'), lines: [t('rule.education.externalExample')] }],
        },
        { id: 'overtime', image: img(3, 3), title: t('rule.education.overtimeTitle'), body: t('rule.education.overtimeDesc'), notes: [] },
        {
          id: 'extraLeave',
          image: img(3, 4),
          title: t('rule.education.extraLeaveTitle'),
          body: (
            <>
              {t('rule.education.extraLeaveDesc')}
              {NB}
              {em(t('rule.education.waitTrigger'))}
              {sep}
              {t('rule.education.excludeText')}
              {NB}
              {em(t('rule.education.hourTrigger'))}
              {sep}
              {t('rule.education.grantText')}
            </>
          ),
          notes: [
            { name: t('rule.education.waitTrigger'), lines: [t('rule.education.waitDesc')] },
            { name: t('rule.education.hourTrigger'), lines: ['ex)', t('rule.education.hourExample1'), t('rule.education.hourExample2')] },
          ],
        },
      ],
    },
    {
      id: 'culture',
      title: t('rule.culture.title'),
      cards: [
        {
          id: 'birthday',
          image: img(4, 1),
          title: t('rule.culture.birthdayTitle'),
          body: (
            <>
              {t('rule.culture.birthdayIntro')}
              {NB}
              {em(t('rule.culture.earlyLeaveTrigger'))}
              {sep}
              {t('rule.culture.earlyLeaveEnd')}
            </>
          ),
          notes: [earlyLeave],
        },
        { id: 'party', image: img(4, 2), title: t('rule.culture.partyTitle'), body: t('rule.culture.partyDesc'), notes: [] },
        {
          id: 'family',
          image: img(4, 3),
          title: t('rule.culture.familyTitle'),
          body: (
            <>
              {t('rule.culture.familyIntro')}
              {NB}
              {em(t('rule.culture.earlyLeaveTrigger'))}
              {sep}
              {t('rule.culture.earlyLeaveEnd')}
            </>
          ),
          notes: [earlyLeave],
        },
        {
          id: 'other',
          image: img(4, 4),
          title: t('rule.culture.otherTitle'),
          body: (
            <>
              {t('rule.culture.otherIntro')}
              {NB}
              {em(t('rule.culture.familyTrigger'))}
              {sep}
              {t('rule.culture.otherEnd')}
            </>
          ),
          notes: [
            {
              name: t('rule.culture.familyTrigger'),
              lines: [t('rule.culture.familyScope'), t('rule.culture.familyIncluded'), t('rule.culture.familyExcluded')],
            },
          ],
        },
      ],
    },
  ]
}
