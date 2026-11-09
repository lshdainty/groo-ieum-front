import { useTranslation } from 'react-i18next'

import { useDesktop } from '@/widgets/layout/lib/use-desktop'
import { ScreenBody, ScreenTitleRow } from '@/widgets/layout/ui/ScreenBody'
import { NoticeListDesktop } from './NoticeListDesktop'
import { NoticeListPhone } from './NoticeListPhone'

/**
 * 공지사항 — 데스크톱(768 이상)은 제목 줄 + 머리 없는 목록 카드 + 쪽 번호(주소 `?page=n`), 폰은 흰 면 하나 + 끝없이 불러오기.
 * 줄을 누르면 상세 페이지(`/notice/:id`)로 간다(HN2 B).
 */
export const UserNoticeContent = () => {
  const { t } = useTranslation('sidebar')
  const desktop = useDesktop()
  return (
    <ScreenBody density='medium'>
      <ScreenTitleRow title={t('menu.notice')} />
      {desktop ? <NoticeListDesktop /> : <NoticeListPhone />}
    </ScreenBody>
  )
}
