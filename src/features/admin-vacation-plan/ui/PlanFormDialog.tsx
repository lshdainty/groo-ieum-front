import { useRef, useState } from 'react'
import { useLeaveConfirm } from '@/shared/ds/alert-dialog'
import { isAxiosError } from 'axios'
import { EllipsisVertical, FileText, ListChecks, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { claimFailure, writeFailureKey } from '@/shared/api/failure'
import { Button } from '@/shared/ds/button'
import { Callout } from '@/shared/ds/callout'
import { ResponsiveDialog, ResponsiveDialogBody, ResponsiveDialogCancel, ResponsiveDialogContent, ResponsiveDialogFooter } from '@/shared/ds/dialog'
import { Field } from '@/shared/ds/field'
import { Input } from '@/shared/ds/input'
import { ResponsiveMenu, ResponsiveMenuContent, ResponsiveMenuItem, ResponsiveMenuTrigger } from '@/shared/ds/menu'
import { ResultSection } from '@/shared/ds/result-section'
import { Skeleton } from '@/shared/ds/skeleton'
import { useSnackbar } from '@/shared/ds/snackbar'
import { Textarea } from '@/shared/ds/textarea'
import { ConfirmDialog } from '@/shared/ui/confirm'
import { CheckBox, CheckBoxGroup } from '@/shared/ui/groo/select-box'
import { useVacationTypesQuery } from '@/entities/type'
import {
  useDeleteVacationPlanMutation,
  usePostVacationPlanMutation,
  usePutPlanPoliciesMutation,
  usePutVacationPlanMutation,
  type VacationPlanResp,
} from '@/entities/vacation-plan'
import { useVacationPoliciesQuery } from '@/entities/vacation-policy'
import { grantMethodLabel, nameOf } from '@/features/admin-vacation-policy/lib/policy-format'

const CODE_PATTERN = /^[A-Za-z0-9_]+$/
/** 서버가 같은 코드의 플랜을 거절할 때의 코드(HrErrorCode VACATION_PLAN_002) */
const CODE_DUPLICATE = 'VACATION_PLAN_002'

const errorCode = (error: unknown): string | undefined =>
  isAxiosError(error) ? (error.response?.data as { code?: string } | undefined)?.code : undefined

const sameIds = (a: number[], b: number[]): boolean => a.length === b.length && [...a].sort().every((v, i) => v === [...b].sort()[i])

/**
 * 휴가 플랜 폼(I-24 I 42 · 43) — 플랜 줄을 누르면 열린다(수정 = 코드 읽기 전용 · 새 플랜 = 코드 입력). 한 대화상자 안에서 두 화면:
 * "form"(코드 · 이름 · 설명) · "policies"(정책 관리 — 여럿 고르기 Select Box, ← 로 돌아온다). 만든 플랜에는 머리 ⋮ "정책 관리 · 삭제"가 있다.
 * 삭제 확인창이 폼 뒤에서 실패하면 폼 맨 위 Callout, 코드 중복(409)은 코드 칸 아래.
 */
export function PlanFormDialog({
  plan,
  open,
  onOpenChange,
}: {
  /** 수정할 플랜 — 없으면 새 플랜 */
  plan: VacationPlanResp | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation('vacation')
  const { t: tc } = useTranslation('common')
  const snackbar = useSnackbar()
  const create = usePostVacationPlanMutation()
  const update = usePutVacationPlanMutation()
  const putPolicies = usePutPlanPoliciesMutation()
  const remove = useDeleteVacationPlanMutation()
  const policiesQuery = useVacationPoliciesQuery({ quiet: true })
  const { data: vacationTypes } = useVacationTypesQuery({ quiet: true })

  const editing = plan !== null
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [view, setView] = useState<'form' | 'policies'>('form')
  const [picked, setPicked] = useState<number[]>([])
  const [savedIds, setSavedIds] = useState<number[]>([])
  const [seenOpen, setSeenOpen] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const [codeDuplicate, setCodeDuplicate] = useState(false)
  const [busy, setBusy] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const deleted = useRef(false)
  const contentRef = useRef<HTMLDivElement>(null)

  if (open !== seenOpen) {
    setSeenOpen(open)
    if (open) {
      const ids = (plan?.policies ?? []).map((p) => p.id)
      setCode(plan?.code ?? '')
      setName(plan?.name ?? '')
      setDesc(plan?.desc ?? '')
      setView('form')
      setPicked(ids)
      setSavedIds(ids)
      setShowErrors(false)
      setCodeDuplicate(false)
      setSaveError(null)
      deleted.current = false
    }
  }

  const formDirty = editing ? name !== plan.name || desc !== (plan.desc ?? '') : code !== '' || name !== '' || desc !== ''
  const policiesDirty = !sameIds(picked, savedIds)
  const codeEmpty = code.trim() === ''
  const codeBad = !editing && !codeEmpty && !CODE_PATTERN.test(code)
  const nameEmpty = name.trim() === ''

  // 정책 관리에서 고른 것을 저장 없이 ← 로 버리면 묻는다(그냥 돌아가면 고른 값이 폼 저장과 함께 조용히 사라진다)
  const back = useLeaveConfirm({
    dirty: policiesDirty,
    contentRef,
    busy,
    leave: () => {
      setPicked(savedIds)
      setView('form')
    },
  })

  const failure = (error: unknown): void => {
    claimFailure(error)
    const key = writeFailureKey(error)
    if (key) setSaveError(tc(key))
  }

  const submitForm = async () => {
    if (busy) return
    if ((!editing && (codeEmpty || codeBad)) || nameEmpty) {
      setShowErrors(true)
      return
    }
    setBusy(true)
    setSaveError(null)
    try {
      if (editing) await update.mutateAsync({ code: plan.code, data: { name: name.trim(), desc } })
      else await create.mutateAsync({ code: code.trim(), name: name.trim(), desc })
      onOpenChange(false)
      snackbar.show({ message: t(editing ? 'adminPlan.editSaved' : 'adminPlan.created'), tone: 'positive' })
    } catch (error) {
      if (!editing && errorCode(error) === CODE_DUPLICATE) {
        claimFailure(error)
        setCodeDuplicate(true)
      } else failure(error)
    } finally {
      setBusy(false)
    }
  }

  const submitPolicies = async () => {
    if (!plan || busy) return
    setBusy(true)
    setSaveError(null)
    try {
      await putPolicies.mutateAsync({ code: plan.code, policyIds: picked })
      setSavedIds(picked)
      setView('form')
      snackbar.show({ message: t('adminPlan.policiesSaved'), tone: 'positive' })
    } catch (error) {
      failure(error)
    } finally {
      setBusy(false)
    }
  }

  const all = policiesQuery.data ?? []
  const policyBody = policiesQuery.isLoadingError ? (
    <ResultSection
      kind='failure'
      size='medium'
      title={t('adminPlan.policiesFailureTitle')}
      description={t('memberVacation.failureDescription')}
      primaryAction={{ label: tc('retry'), onClick: () => void policiesQuery.refetch(), loading: policiesQuery.isFetching }}
    />
  ) : policiesQuery.isPending ? (
    <div className='flex flex-col gap-x3'>
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} text='t5' className='block h-[64px] w-full' />
      ))}
    </div>
  ) : all.length === 0 ? (
    <ResultSection size='medium' icon={<FileText />} title={t('adminPolicy.emptyTitle')} description={t('adminPolicy.emptyDescription')} />
  ) : (
    <CheckBoxGroup aria-label={plan ? t('adminPlan.policiesTitle', { name: plan.name }) : ''} data-plan-policy-group>
      {all.map((p) => (
        <CheckBox
          key={p.vacation_policy_id}
          label={p.vacation_policy_name}
          description={t('adminPlan.policyDetail', { method: grantMethodLabel(t, p.grant_method), type: nameOf(vacationTypes, p.vacation_type) })}
          checked={picked.includes(p.vacation_policy_id)}
          onCheckedChange={(checked) => setPicked((ids) => (checked ? [...ids, p.vacation_policy_id] : ids.filter((id) => id !== p.vacation_policy_id)))}
        />
      ))}
    </CheckBoxGroup>
  )

  const headerAction =
    editing && view === 'form' ? (
      <ResponsiveMenu>
        <ResponsiveMenuTrigger asChild>
          <Button variant='ghost' layout='iconOnly' size='medium' aria-label={t('adminPlan.moreFor', { name: plan.name })} data-plan-more>
            <EllipsisVertical />
          </Button>
        </ResponsiveMenuTrigger>
        <ResponsiveMenuContent title={plan.name}>
          <ResponsiveMenuItem icon={<ListChecks />} label={t('adminPlan.managePolicies')} onSelect={() => setView('policies')} />
          <ResponsiveMenuItem icon={<Trash2 />} label={tc('delete')} tone='critical' onSelect={() => setConfirmOpen(true)} />
        </ResponsiveMenuContent>
      </ResponsiveMenu>
    ) : undefined

  const title = view === 'policies' && plan ? t('adminPlan.policiesTitle', { name: plan.name }) : t(editing ? 'adminPlan.editTitle' : 'adminPlan.addTitle')

  return (
    <>
      <ResponsiveDialog open={open} form dirty={formDirty || policiesDirty} busy={busy} onOpenChange={onOpenChange}>
        <ResponsiveDialogContent title={title} headerAction={headerAction} ref={contentRef} onBack={view === 'policies' ? () => void back.request() : undefined}>
          <ResponsiveDialogBody scrollFog={view === 'policies'}>
            {saveError && (
              <Callout tone='critical' role='alert' className='mb-x4' data-save-failure>
                {saveError}
              </Callout>
            )}
            {view === 'form' ? (
              <div className='flex flex-col gap-x6 pb-x2' data-plan-form>
                <Field
                  label={t('adminPlan.code')}
                  showRequiredIndicator={!editing}
                  readOnly={editing}
                  description={editing ? t('adminPlan.codeLocked') : undefined}
                  invalid={!editing && (codeDuplicate || (showErrors && (codeEmpty || codeBad)))}
                  errorMessage={codeDuplicate ? t('adminPlan.codeDuplicate') : codeEmpty ? t('adminPlan.codeRequired') : t('adminPlan.codePattern')}
                >
                  <Input value={editing ? plan.code : code} readOnly={editing} placeholder={t('adminPlan.codePlaceholder')} onChange={(e) => { setCode(e.target.value); setCodeDuplicate(false) }} />
                </Field>
                <Field label={t('adminPlan.name')} showRequiredIndicator invalid={showErrors && nameEmpty} errorMessage={t('adminPlan.nameRequired')}>
                  <Input value={name} placeholder={t('adminPlan.namePlaceholder')} onChange={(e) => setName(e.target.value)} />
                </Field>
                <Field label={t('adminPlan.desc')}>
                  <Textarea value={desc} placeholder={t('adminPlan.descPlaceholder')} onChange={(e) => setDesc(e.target.value)} />
                </Field>
              </div>
            ) : (
              <div className='pb-x2'>{policyBody}</div>
            )}
          </ResponsiveDialogBody>
          <ResponsiveDialogFooter>
            <ResponsiveDialogCancel>{tc('cancel')}</ResponsiveDialogCancel>
            {view === 'form' ? (
              <Button loading={busy} onClick={() => void submitForm()} data-plan-save>
                {tc('save')}
              </Button>
            ) : (
              <Button loading={busy} disabled={policiesQuery.isLoadingError || !policiesDirty} onClick={() => void submitPolicies()} data-plan-policies-save>
                {tc('save')}
              </Button>
            )}
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
        {back.node}
      </ResponsiveDialog>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('plan.deleteTitle')}
        description={t('plan.deleteConfirm', { name: plan?.name ?? '' })}
        onConfirm={async () => {
          if (!plan) return
          try {
            await remove.mutateAsync(plan.code)
            deleted.current = true
          } catch (error) {
            // 폼이 뒤에 열려 있다 — 확인창을 닫고 폼 맨 위 Callout 으로 알린다
            claimFailure(error)
            const key = writeFailureKey(error)
            if (key) setSaveError(key === 'failure.write' ? tc('failure.delete') : key === 'failure.writeInput' ? tc('failure.deleteInput') : key === 'failure.unconfirmed' ? tc('failure.deleteUnconfirmed') : tc(key))
          }
        }}
        onDone={() => {
          if (!deleted.current) return
          onOpenChange(false)
          snackbar.show({ message: t('adminPlan.deleted'), tone: 'positive' })
        }}
      />
    </>
  )
}
