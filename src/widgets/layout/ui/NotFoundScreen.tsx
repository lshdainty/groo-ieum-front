import { FileQuestion } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { ResultSection } from '@/shared/ds/result-section'

/** 로그인한 사람이 모르는 주소로 왔을 때 — 틀 안, 본문 가운데(H-A14 A). 사이드바에는 지금 항목이 없다 */
export function NotFoundScreen() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  return (
    // 흰 면(카드) 위에 올린다 — Result Section 의 [홈으로] 는 neutralWeak 라 회색 바닥(basement) 위에 바로 놓으면 채움이 바닥과 같은 색이 된다(button.md "놓는 바탕").
    // Result Section 이 버튼 변형을 받지 않아 ds 를 고치지 않고 놓는 바탕을 바꿨다(그루 계정 18-2 의 "찾을 수 없어요"가 카드 안 Result Section 인 것과 같다)
    <div className='flex min-h-full p-x6 max-[47.99rem]:p-x4'>
      <div className='flex flex-1 rounded-r5 bg-bg-layer-default'>
      <ResultSection
        size='large'
        icon={<FileQuestion aria-hidden />}
        title={t('notFound.title')}
        description={t('notFound.description')}
        primaryAction={{ label: t('notFound.home'), onClick: () => navigate('/dashboard') }}
      />
      </div>
    </div>
  )
}
