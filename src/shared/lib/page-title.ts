import { useEffect } from 'react'

const PRODUCT = '그루 이음'

/** 앱 틀 밖 화면(로그인 · 결과 · 기다림)의 문서 제목 "{화면} - 그루 이음". 화면을 떠나면 이전 제목으로 되돌린다 */
export const usePageTitle = (screen?: string): void => {
  useEffect(() => {
    const previous = document.title || PRODUCT
    document.title = screen ? `${screen} - ${PRODUCT}` : PRODUCT
    return () => {
      document.title = previous
    }
  }, [screen])
}
