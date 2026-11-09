import { useState } from 'react'
import { ShieldEllipsis } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ds/button'
import { Callout } from '@/shared/ds/callout'
import { ResponsiveDialog, ResponsiveDialogBody, ResponsiveDialogCancel, ResponsiveDialogContent, ResponsiveDialogFooter } from '@/shared/ds/dialog'
import { List, ListCheckItem } from '@/shared/ds/list'
import { ResultSection } from '@/shared/ds/result-section'
import { Skeleton } from '@/shared/ds/skeleton'
import { useSnackbar } from '@/shared/ds/snackbar'
import { useDeleteRevokePlanFromUserMutation, usePostAssignPlansToUserMutation, useUserVacationPlansQuery, useVacationPlansQuery } from '@/entities/vacation-plan'
import { readWriteFailure } from '@/shared/ui/groo/write-error'

interface UserVacationPlanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  userName?: string
}

/**
 * 휴가 플랜(I-24 F 29) — 폼 Dialog 480 / 시트. 내용 = 플랜을 여럿 고르는 체크 줄(제목 플랜 이름 · 설명 "정책 {n}개" — 칸 없는 체크가 아니라
 * ds List 체크 줄), 바닥 [취소][저장]. 요청은 지금 그대로(더한 플랜 = 한 번에 할당, 뺀 플랜 = 하나씩 회수).
 * 불러오기는 quiet — 표면 안 Result Section + [다시 시도]. 저장 실패는 맨 위 Callout.
 */
const UserVacationPlanDialog = ({ open, onOpenChange, userId, userName }: UserVacationPlanDialogProps) => {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const snackbar = useSnackbar()
  const all = useVacationPlansQuery({ quiet: true })
  const mine = useUserVacationPlansQuery(userId, { quiet: true })
  const assign = usePostAssignPlansToUserMutation()
  const revoke = useDeleteRevokePlanFromUserMutation()
  const [picked, setPicked] = useState<Set<string> | null>(null)
  const [busy, setBusy] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const plans = all.data ?? []
  const original = new Set((mine.data ?? []).map((p) => p.code))
  const current = picked ?? original
  const added = plans.filter((p) => current.has(p.code) && !original.has(p.code)).map((p) => p.code)
  const removed = [...original].filter((c) => !current.has(c))
  const dirty = added.length + removed.length > 0
  const pending = all.isPending || mine.isPending
  const failed = all.isLoadingError || mine.isLoadingError

  const toggle = (code: string, on: boolean) => {
    const next = new Set(current)
    if (on) next.add(code)
    else next.delete(code)
    setPicked(next)
  }

  const submit = async () => {
    if (busy || !dirty) return
    setBusy(true)
    setSaveError(null)
    try {
      if (added.length > 0) await assign.mutateAsync({ userId, planCodes: added })
      for (const code of removed) await revoke.mutateAsync({ userId, code })
      onOpenChange(false)
      snackbar.show({ message: t('users.planSaved'), tone: 'positive' })
    } catch (error) {
      const { key } = readWriteFailure(error)
      if (key) setSaveError(tc(key))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ResponsiveDialog open={open} form dirty={dirty} busy={busy} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent title={t('user.vacationPlan')} description={userName}>
        <ResponsiveDialogBody>
          {saveError && (
            <Callout tone='critical' role='alert' className='mb-x4' data-save-failure>
              {saveError}
            </Callout>
          )}
          {failed ? (
            <ResultSection
              kind='failure'
              size='medium'
              title={t('users.planFailureTitle')}
              description={t('users.failureDescription')}
              primaryAction={{ label: tc('retry'), onClick: () => { void all.refetch(); void mine.refetch() }, loading: all.isFetching || mine.isFetching }}
            />
          ) : pending ? (
            <div className='flex flex-col gap-x3'>
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} text='t5' className='block w-full' />
              ))}
            </div>
          ) : plans.length === 0 ? (
            <ResultSection size='medium' icon={<ShieldEllipsis />} title={t('users.planEmptyTitle')} description={t('users.planEmptyDescription')} />
          ) : (
            <List data-plan-list>
              {plans.map((plan) => (
                <ListCheckItem
                  key={plan.code}
                  title={<span className='[overflow-wrap:break-word] [word-break:keep-all]'>{plan.name}</span>}
                  detail={t('user.planPolicyCount', { count: plan.policies?.length || 0 })}
                  checked={current.has(plan.code)}
                  onCheckedChange={(c) => toggle(plan.code, c === true)}
                />
              ))}
            </List>
          )}
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          <ResponsiveDialogCancel>{tc('cancel')}</ResponsiveDialogCancel>
          <Button loading={busy} disabled={!dirty || pending || failed} onClick={() => void submit()}>
            {tc('save')}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

export { UserVacationPlanDialog }
