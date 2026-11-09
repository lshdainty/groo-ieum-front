import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { claimFailure, writeFailureKey } from '@/shared/api/failure'
import { Button } from '@/shared/ds/button'
import { Callout } from '@/shared/ds/callout'
import { Checkbox } from '@/shared/ds/checkbox'
import { ResponsiveDialog, ResponsiveDialogBody, ResponsiveDialogCancel, ResponsiveDialogContent, ResponsiveDialogFooter } from '@/shared/ds/dialog'
import { Field } from '@/shared/ds/field'
import { ResultSection } from '@/shared/ds/result-section'
import { Select, SelectItem } from '@/shared/ds/select'
import { Skeleton } from '@/shared/ds/skeleton'
import { useSnackbar } from '@/shared/ds/snackbar'
import { Textarea } from '@/shared/ds/textarea'
import { useEffectiveTypesQuery, useExpirationTypesQuery } from '@/entities/type'
import { usePostManualGrantVacationMutation } from '@/entities/vacation'
import { useUserAssignedVacationPoliciesQuery } from '@/entities/vacation-policy'
import { DayField } from '@/shared/ui/groo/day-field'
import { GrantTimeField } from '@/shared/ui/groo/grant-time-field'
import { grantFormChanged, grantFormErrors, grantFormOf, grantPayloadOf, type GrantFormValues } from '../lib/grant-form'

/**
 * 휴가 부여 폼(I-24 C 16) — ds Responsive Dialog `form`(1280 이상 대화상자 · 미만 Bottom Sheet), 바닥 [취소] [부여].
 * 받는 사람은 직원 휴가 탭에서 고른 사람이다(폼 안에 사람 고르기가 없다). 정책은 그 사람에게 걸린 "관리자가 직접 부여" 정책만.
 * 칸 차례: 정책 → (부여일 · 만료일 직접 정하기) → 부여 시간 → 사유. 저장 실패는 폼 맨 위 Callout(고정 글), 칸 오류는 칸 아래.
 */
export function VacationGrantDialog({
  open,
  user,
  onOpenChange,
  onCloseAutoFocus,
}: {
  open: boolean
  user: { id: string; name: string }
  onOpenChange: (open: boolean) => void
  onCloseAutoFocus?: (e: Event) => void
}) {
  const { t } = useTranslation('vacation')
  const { t: tc } = useTranslation('common')
  const snackbar = useSnackbar()
  const [values, setValues] = useState<GrantFormValues>(grantFormOf())
  const [showErrors, setShowErrors] = useState(false)
  const [busy, setBusy] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const reasonRef = useRef<HTMLTextAreaElement>(null)
  const grant = usePostManualGrantVacationMutation()
  const policiesQuery = useUserAssignedVacationPoliciesQuery(user.id, undefined, 'MANUAL_GRANT', { quiet: true })
  const { data: effectiveTypes = [] } = useEffectiveTypesQuery()
  const { data: expirationTypes = [] } = useExpirationTypesQuery()
  const policies = policiesQuery.data ?? []
  const policy = policies.find((p) => String(p.vacation_policy_id) === values.policyId)

  const set = <K extends keyof GrantFormValues>(key: K, value: GrantFormValues[K]) => setValues((v) => ({ ...v, [key]: value }))
  const errors = grantFormErrors(values)
  const dirty = grantFormChanged(values)

  const pickPolicy = (id: string) => {
    const next = policies.find((p) => String(p.vacation_policy_id) === id)
    // 시간이 정해진 정책은 그 시간으로, 가변 정책은 0 에서 시작한다
    setValues((v) => ({ ...v, policyId: id, grantTime: next && next.is_flexible_grant === 'N' ? next.grant_time : 0 }))
  }

  const submit = async () => {
    if (busy) return
    if (Object.keys(errors).length > 0) {
      setShowErrors(true)
      return
    }
    setBusy(true)
    setSaveError(null)
    try {
      await grant.mutateAsync(grantPayloadOf(user.id, values))
      onOpenChange(false)
      snackbar.show({ message: t('grantForm.saved'), tone: 'positive' })
    } catch (error) {
      claimFailure(error)
      const key = writeFailureKey(error)
      if (key) setSaveError(key === 'failure.write' ? t('grantForm.saveFailed') : tc(key))
    } finally {
      setBusy(false)
    }
  }

  const name = (list: { code: string; name: string }[], code: string | null | undefined) =>
    code ? (list.find((x) => x.code === code)?.name ?? t('grantForm.policyDefault')) : t('grantForm.policyDefault')

  const noPolicy = policiesQuery.isSuccess && policies.length === 0
  const flexible = policy?.is_flexible_grant === 'Y'
  const withMinutes = policy?.minute_grant_yn === 'Y'

  return (
    <ResponsiveDialog open={open} form dirty={dirty} busy={busy} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent title={t('grantForm.title')} onCloseAutoFocus={onCloseAutoFocus}>
        <ResponsiveDialogBody>
          {saveError && (
            <Callout tone='critical' role='alert' className='mb-x4' data-save-failure>
              {saveError}
            </Callout>
          )}
          <p className='mb-x6 mt-0 text-t4 font-normal text-fg-neutral-muted [overflow-wrap:break-word] [word-break:keep-all]' data-grant-recipient>
            {t('grantForm.recipient', { name: user.name })}
          </p>
          {policiesQuery.isLoadingError ? (
            <ResultSection
              kind='failure'
              size='medium'
              title={t('grantForm.policyFailureTitle')}
              description={t('memberVacation.failureDescription')}
              primaryAction={{ label: tc('retry'), onClick: () => void policiesQuery.refetch(), loading: policiesQuery.isFetching }}
            />
          ) : (
            <div className='flex flex-col gap-x6 pb-x2'>
              <Field
                label={t('grantForm.policy')}
                showRequiredIndicator
                invalid={showErrors && !!errors.policy}
                errorMessage={t('grantForm.policyRequired')}
              >
                {policiesQuery.isPending ? (
                  <Skeleton text='t5' className='block h-[40px] w-full' />
                ) : (
                  <Select
                    value={values.policyId}
                    onValueChange={pickPolicy}
                    disabled={noPolicy}
                    placeholder={noPolicy ? t('grantForm.noPolicy') : t('grantForm.policyPlaceholder')}
                    aria-invalid={(showErrors && !!errors.policy) || undefined}
                  >
                    {policies.map((p) => (
                      <SelectItem key={p.vacation_policy_id} value={String(p.vacation_policy_id)} label={p.vacation_policy_name} />
                    ))}
                  </Select>
                )}
              </Field>
              {policy && (
                <>
                  <Checkbox
                    label={t('grantForm.customDates')}
                    checked={values.customDates}
                    onCheckedChange={(checked) => set('customDates', checked === true)}
                  />
                  {values.customDates ? (
                    <>
                      <DayField
                        label={t('grantForm.validityStart')}
                        placeholder={t('grantForm.datePlaceholder')}
                        value={values.grantDate}
                        onValueChange={(d) => set('grantDate', d)}
                        invalid={showErrors && !!errors.grantDate}
                        errorMessage={t('grantForm.dateRequired')}
                      />
                      <DayField
                        label={t('grantForm.validityEnd')}
                        placeholder={t('grantForm.datePlaceholder')}
                        value={values.expiryDate}
                        onValueChange={(d) => set('expiryDate', d)}
                        invalid={showErrors && !!errors.expiryDate}
                        errorMessage={t('grantForm.dateRequired')}
                      />
                    </>
                  ) : (
                    <div className='flex flex-col gap-x4' data-grant-rules>
                      <Field label={t('grantForm.validityStart')} description={t('grantForm.startRule')} readOnly>
                        <p className='m-0 text-t5 font-normal text-fg-neutral'>{name(effectiveTypes, policy.effective_type)}</p>
                      </Field>
                      <Field label={t('grantForm.validityEnd')} description={t('grantForm.endRule')} readOnly>
                        <p className='m-0 text-t5 font-normal text-fg-neutral'>{name(expirationTypes, policy.expiration_type)}</p>
                      </Field>
                    </div>
                  )}
                  <GrantTimeField
                    label={t('grantForm.grantTime')}
                    value={values.grantTime}
                    onValueChange={(total) => set('grantTime', total)}
                    withMinutes={withMinutes}
                    locked={!flexible}
                    description={!flexible ? t('grantForm.timeFixed') : withMinutes ? t('grantForm.timeHelpMinutes') : t('grantForm.timeHelp')}
                    invalid={showErrors && !!errors.grantTime}
                    errorMessage={t('grantForm.timeRequired')}
                  />
                  <Field label={t('grantForm.reason')} showRequiredIndicator invalid={showErrors && !!errors.reason} errorMessage={t('grantForm.reasonRequired')}>
                    <Textarea ref={reasonRef} value={values.reason} placeholder={t('grantForm.reasonPlaceholder')} onChange={(e) => set('reason', e.target.value)} />
                  </Field>
                </>
              )}
            </div>
          )}
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          <ResponsiveDialogCancel>{tc('cancel')}</ResponsiveDialogCancel>
          <Button loading={busy} disabled={policiesQuery.isLoadingError} onClick={() => void submit()}>
            {t('grantForm.submit')}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
