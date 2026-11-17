import { useState, type ReactNode } from 'react'
import { unstable_HistoryRouter as HistoryRouter } from 'react-router-dom'

import { createAppHistory } from '@/app/router/app-history'

/**
 * 앱 라우터 — BrowserRouter 와 같은 히스토리에 "표면 칸 되돌림이 끝난 뒤 옮기기" 를 더했다(app-history.ts).
 * 시트 · 확인창을 [×] 로 닫자마자 다른 메뉴로 옮겨도 뒤로 가기가 꼬이지 않는다.
 */
export function AppHistoryRouter({ children }: { children: ReactNode }) {
  const [history] = useState(createAppHistory)
  return <HistoryRouter history={history}>{children}</HistoryRouter>
}
