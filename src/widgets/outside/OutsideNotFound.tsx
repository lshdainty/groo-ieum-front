import { FileQuestion } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { ResultScreen } from '@/widgets/outside/ResultScreen'

/**
 * 로그인 전(또는 비밀번호 변경 전) 모르는 주소 — 흰 면 404(H-A14 A). 틀 안 404(NotFoundScreen)와 같은 Result Section · 같은 글이다.
 * [홈으로] 는 /dashboard 로 — 로그인 전이면 거기서 /login 으로 간다. 몰래 다른 곳으로 돌리지 않는다(없는 주소는 없다고 말한다).
 */
export function OutsideNotFound() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  return (
    <ResultScreen
      kind='empty'
      icon={<FileQuestion />}
      title={t('notFound.title')}
      description={t('notFound.description')}
      action={{ label: t('notFound.home'), onClick: () => navigate('/dashboard') }}
    />
  )
}
