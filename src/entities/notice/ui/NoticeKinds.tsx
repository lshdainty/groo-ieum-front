import { useTranslation } from 'react-i18next'

import { Badge } from '@/shared/ds/badge'
import type { NoticeType, YNType } from '@/entities/notice/model/types'
import { NOTICE_TONE } from '@/entities/notice/lib/notice-tone'

/** 공지 배지 줄 — 분류 Badge weak(색은 NOTICE_TONE) + 고정이면 brand "고정"(사이 6). 뒤에 더 붙일 것(노출 상태 등)은 children */
export const NoticeKinds = ({
  type,
  typeName,
  pinned,
  children,
}: {
  type: NoticeType
  typeName: string
  pinned?: YNType
  children?: React.ReactNode
}) => {
  const { t } = useTranslation('notice')
  return (
    <span className='flex flex-wrap items-center gap-x1_5'>
      <Badge tone={NOTICE_TONE[type]}>{typeName}</Badge>
      {pinned === 'Y' && <Badge tone='brand'>{t('pinned')}</Badge>}
      {children}
    </span>
  )
}
