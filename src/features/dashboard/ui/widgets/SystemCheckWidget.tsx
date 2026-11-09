import { useMemo, useState } from 'react'
import { Monitor } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { List, ListCheckItem } from '@/shared/ds/list'
import { ResultSection } from '@/shared/ds/result-section'
import { useSnackbar } from '@/shared/ds/snackbar'
import { Skeleton } from '@/shared/ds/skeleton'
import { claimFailure } from '@/shared/api/failure'
import {
  useSystemCheckStatusQuery,
  useSystemTypesQuery,
  useToggleSystemCheckMutation,
  type SystemType,
} from '@/entities/work'
import { WidgetBoundary } from '@/features/dashboard/ui/WidgetResults'
import { WidgetFrame } from '@/features/dashboard/ui/WidgetFrame'

/**
 * 시스템 데일리 체크(D 30 — 홈뿐) — 시스템마다 체크 줄(ds ListCheckItem: 체크 24 + 이름 + "오늘 확인했어요 · 오늘 아직 확인하지 않았어요").
 * 줄 전체가 누르는 자리이고 키보드로 닿는다. 누르면 확인 토글 API → 성공하면 다시 읽는다. 보내는 동안 그 줄은 aria-busy 로 막히고,
 * 실패하면 체크를 되돌리고 Snackbar("확인 상태를 바꾸지 못했어요"). 색만으로 상태를 알리지 않는다(체크 + 글).
 */
export const SystemCheckWidget = () => {
  const { t } = useTranslation('dashboard')
  const snackbar = useSnackbar()
  const types = useSystemTypesQuery({ quiet: true })
  const codes = useMemo(() => (types.data ?? []).map((type) => type.code as SystemType), [types.data])
  const status = useSystemCheckStatusQuery(codes, { quiet: true })
  const toggle = useToggleSystemCheckMutation()
  // 보내는 동안 보여 줄 체크 — 서버 값이 돌아오면(성공 · 실패) 비운다
  const [pending, setPending] = useState<Record<string, boolean>>({})

  const systems = useMemo(
    () =>
      [...(types.data ?? [])]
        .sort((a, b) => (a.order_seq || 0) - (b.order_seq || 0))
        .map((type) => ({
          code: type.code as SystemType,
          name: type.name,
          checked: status.data?.statuses.find((s) => s.system_code === type.code)?.checked ?? false,
        })),
    [types.data, status.data],
  )

  const press = (code: SystemType, next: boolean) => {
    if (pending[code] !== undefined) return
    setPending((cur) => ({ ...cur, [code]: next }))
    toggle.mutate(
      { system_code: code },
      {
        onSuccess: async () => {
          await status.refetch()
          setPending(({ [code]: _done, ...rest }) => rest)
        },
        onError: (error) => {
          claimFailure(error)
          setPending(({ [code]: _done, ...rest }) => rest)
          snackbar.show({ message: t('systemCheck.toggleFailed'), tone: 'critical' })
        },
      },
    )
  }

  const queries = codes.length > 0 ? [types, status] : [types]
  return (
    <WidgetFrame id='system-check' body='list'>
      <WidgetBoundary id='system-check' queries={queries} fallback={<SystemCheckSkeleton />}>
        {systems.length === 0 ? (
          <ResultSection size='medium' icon={<Monitor />} title={t('systemCheck.noSystem')} description={t('systemCheck.noSystemDesc')} />
        ) : (
          <List>
            {systems.map((system) => {
              const checked = pending[system.code] ?? system.checked
              return (
                <ListCheckItem
                  key={system.code}
                  data-system={system.code}
                  title={system.name}
                  detail={checked ? t('systemCheck.checked') : t('systemCheck.unchecked')}
                  checked={checked}
                  onCheckedChange={(value) => press(system.code, value === true)}
                  aria-busy={pending[system.code] !== undefined || undefined}
                  align='top'
                />
              )
            })}
          </List>
        )}
      </WidgetBoundary>
    </WidgetFrame>
  )
}

const SystemCheckSkeleton = () => (
  <div className='flex flex-col'>
    {[0, 1, 2].map((i) => (
      <div key={i} className='flex items-start gap-x3 px-x6 py-x3'>
        <Skeleton radius='6' className='size-x6 shrink-0' />
        <div className='flex flex-1 flex-col gap-x1'>
          <Skeleton text='t5' className='block w-1/2' />
          <Skeleton text='t3' className='block w-2/3' />
        </div>
      </div>
    ))}
  </div>
)
