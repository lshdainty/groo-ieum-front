import { useState, type ReactNode } from 'react'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'

import { useUser } from '@/entities/session'
import { usePutUserMutation, useUserQuery } from '@/entities/user'
import type { PutUserReq } from '@/entities/user'
import { PasswordChangeDialog } from '@/features/user-profile/ui/PasswordChangeDialog'
import { UserEditDialog } from '@/features/user-profile/ui/UserEditDialog'
import { AccountDialogsContext } from './account-dialogs-context'

/*
 * 내 정보 · 비밀번호 바꾸기 대화상자의 집 — 틀(Layout)에 둔다. 폰에서는 계정 줄이 옆 패널 안에 있어 패널이 닫히면 함께 사라지므로
 * 대화상자를 패널 밖에 둔다(패널이 대화상자 위를 덮지 않게 연 뒤 패널을 닫는다). 내 정보는 사용자 관리의 "사용자 수정" 과 한 부품이다(I-22 Q4 A · I-24 F 29b).
 */
export function AccountDialogsProvider({ children }: { children: ReactNode }) {
  const { t: tm } = useTranslation('sidebar')
  const { loginUser } = useUser()
  const { mutateAsync: putUser } = usePutUserMutation()
  const { data: userData } = useUserQuery(loginUser?.user_id || '', { quiet: true })
  const [editOpen, setEditOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)

  const handleUpdateUser = (user: PutUserReq) =>
    putUser({
      user_id: user.user_id,
      user_name: user.user_name,
      user_email: user.user_email,
      user_birth: dayjs(user.user_birth).format('YYYY-MM-DD'),
      user_company_type: user.user_company_type,
      user_work_time: user.user_work_time,
      lunar_yn: user.lunar_yn,
      profile_url: user.profile_url,
      profile_uuid: user.profile_uuid,
      profile_delete_yn: user.profile_delete_yn,
      country_code: user.country_code,
    })

  return (
    <AccountDialogsContext.Provider value={{ canEdit: !!userData, openEdit: () => setEditOpen(true), openPassword: () => setPasswordOpen(true) }}>
      {children}
      {userData && editOpen && <UserEditDialog open={editOpen} onOpenChange={setEditOpen} user={userData} title={tm('footer.account')} onSave={handleUpdateUser} />}
      <PasswordChangeDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
    </AccountDialogsContext.Provider>
  )
}
