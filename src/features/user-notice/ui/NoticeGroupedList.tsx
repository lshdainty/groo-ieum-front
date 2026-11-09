import { useId } from 'react'
import { useTranslation } from 'react-i18next'

import { List, ListHeader } from '@/shared/ds/list'
import { NoticeRow, type NoticeListResp } from '@/entities/notice'
import { groupNotices } from '../model/group-notices'

/** 공지 줄 묶음 — 고정이 있으면 "고정" · "모든 공지" 머리(List Header mediumWeak) 아래 List 둘, 없으면 머리 없이 List 하나 */
export const NoticeGroupedList = ({ items }: { items: NoticeListResp[] }) => {
  const { t } = useTranslation('notice')
  const uid = useId()
  return (
    <>
      {groupNotices(items).map((g) => {
        const headId = `${uid}-${g.id}`
        return (
          <div key={g.id}>
            {g.titled && (
              <ListHeader id={headId} variant='mediumWeak'>
                {g.id === 'pinned' ? t('pinned') : t('allNotices')}
              </ListHeader>
            )}
            <List aria-labelledby={g.titled ? headId : undefined}>
              {g.items.map((n) => (
                <NoticeRow key={n.notice_id} notice={n} href={`/notice/${n.notice_id}`} />
              ))}
            </List>
          </div>
        )
      })}
    </>
  )
}
