import { createContext, useContext } from 'react'

export interface AccountDialogsApi {
  /** 내 정보 상세를 받아 왔는가 — 없으면 두 줄을 그리지 않는다 */
  canEdit: boolean
  openEdit: () => void
  openPassword: () => void
}

export const AccountDialogsContext = createContext<AccountDialogsApi>({
  canEdit: false,
  openEdit: () => undefined,
  openPassword: () => undefined,
})
export const useAccountDialogs = (): AccountDialogsApi => useContext(AccountDialogsContext)
