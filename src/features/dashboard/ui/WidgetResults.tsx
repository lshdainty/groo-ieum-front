import type { UseQueryResult } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { ResultSection } from '@/shared/ds/result-section'
import { LoadingRegion } from '@/shared/ds/skeleton'
import { eulReul } from '@/features/dashboard/lib/josa'
import { widgetOf } from '@/features/dashboard/lib/widgets'

/**
 * 위젯 하나가 읽기에 실패했을 때(U) — 서버 글을 그리지 않고 "{위젯}을/를 불러오지 못했어요" + "잠시 뒤 다시 시도해주세요." + [다시 시도].
 * 그 위젯의 질의만 다시 받는다. name 은 위젯 이름(편집 목록 · 카드 머리와 같은 글).
 */
export const WidgetFailure = ({ name, onRetry, retrying }: { name: string; onRetry: () => void; retrying?: boolean }) => {
  const { t, i18n } = useTranslation('dashboard')
  const { t: tc } = useTranslation('common')
  return (
    <ResultSection
      kind='failure'
      size='medium'
      title={t('widget.failureTitle', { name, eulReul: eulReul(name, i18n.language) })}
      description={t('widget.failureDescription')}
      primaryAction={{ label: tc('retry'), onClick: onRetry, loading: retrying }}
    />
  )
}

/**
 * 위젯 본문의 기다림 · 실패 한 벌 — 질의 하나 이상을 받는다. 하나라도 받는 중이면 스켈레톤(머리는 틀이 이미 그렸다),
 * 하나라도 내용 없이 실패하면 Result Section + [다시 시도](실패한 질의만 다시 받는다). 다 받으면 내용.
 * 켜지지 않은(enabled false) 질의를 넣지 않는다 — 영원히 받는 중으로 남는다.
 */
export function WidgetBoundary({
  id,
  queries,
  fallback,
  children,
}: {
  id: string
  queries: readonly Pick<UseQueryResult, 'isPending' | 'isLoadingError' | 'isFetching' | 'refetch'>[]
  fallback: ReactNode
  children: ReactNode
}) {
  const { t } = useTranslation('dashboard')
  const widget = widgetOf(id)
  const pending = queries.some((q) => q.isPending)
  const failed = queries.some((q) => q.isLoadingError)
  const retry = () => {
    for (const q of queries) if (q.isLoadingError) void q.refetch()
  }
  return (
    <LoadingRegion
      pending={pending}
      failed={failed}
      fallback={fallback}
      failure={<WidgetFailure name={widget ? t(widget.labelKey) : id} onRetry={retry} retrying={queries.some((q) => q.isFetching)} />}
    >
      {children}
    </LoadingRegion>
  )
}
