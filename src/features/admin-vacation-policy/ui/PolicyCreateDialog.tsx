import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { claimFailure, writeFailureKey } from '@/shared/api/failure'
import { isAxiosError } from 'axios'
import { Button } from '@/shared/ds/button'
import { Callout } from '@/shared/ds/callout'
import { Checkbox } from '@/shared/ds/checkbox'
import { ResponsiveDialog, ResponsiveDialogBody, ResponsiveDialogCancel, ResponsiveDialogContent, ResponsiveDialogFooter } from '@/shared/ds/dialog'
import { Field } from '@/shared/ds/field'
import { Input } from '@/shared/ds/input'
import { QuantityPicker } from '@/shared/ds/quantity-picker'
import { ResultSection } from '@/shared/ds/result-section'
import { Select, SelectItem } from '@/shared/ds/select'
import { Skeleton } from '@/shared/ds/skeleton'
import { useSnackbar } from '@/shared/ds/snackbar'
import { Textarea } from '@/shared/ds/textarea'
import { DayField } from '@/shared/ui/groo/day-field'
import { GrantTimeField } from '@/shared/ui/groo/grant-time-field'
import { RadioBox, RadioBoxGroup } from '@/shared/ui/groo/select-box'
import { useCompanyQuery, useCompanyWithDepartmentsQuery } from '@/entities/company'
import { useEffectiveTypesQuery, useExpirationTypesQuery, useVacationTypesQuery } from '@/entities/type'
import { usePostVacationPolicyMutation } from '@/entities/vacation-policy'
import {
  DESC_MAX,
  GRANT_METHODS,
  INTERVAL_MAX,
  MAX_COUNT_MAX,
  NAME_MAX,
  REPEAT_UNITS,
  approvalLimitOf,
  dayRuleOf,
  fieldsOf,
  initialValues,
  toPayload,
  validate,
  type GrantMethod,
  type PolicyFormValues,
} from '../lib/policy-form'
import { grantMethodLabel, repeatUnitLabel } from '../lib/policy-format'

const NAME_DUPLICATE_CODE = 'VACATION_014'
const errorCode = (error: unknown): string | undefined =>
  isAxiosError(error) ? (error.response?.data as { code?: string } | undefined)?.code : undefined

/** 분 단위를 끌 때 — 30분 조각을 버리고 시간 단위로 맞춘다(지금 폼과 같다) */
const dropMinutes = (total: number): number => {
  const days = Math.floor(total + 1e-9)
  const hours = Math.floor((total - days) / 0.125 + 1e-9)
  return days + hours * 0.125
}

/**
 * 휴가 정책 만들기(I-24 H 39) — 부여 방법을 먼저 고르는 두 단계. 같은 Responsive Dialog 안에서 ← 로 돌아간다.
 * 1단계: 하나 고르기 Select Box 셋 → [다음]. 2단계: 고른 방법의 칸만(반복 부여 13 · 신청할 때 9 · 직접 부여 8).
 * 값은 방법마다 따로 둔다 — 같은 방법으로 돌아오면 그대로, 다른 방법을 고르면 그 방법의 처음 값. 요청 본문은 지금 CreateVacationPolicyReq 그대로.
 * 이름 중복(409 VACATION_014)은 이름 칸 아래, 그 밖 실패는 폼 맨 위 Callout.
 */
export function PolicyCreateDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation('vacation')
  const { t: tc } = useTranslation('common')
  const snackbar = useSnackbar()
  const post = usePostVacationPolicyMutation()
  const vacationTypes = useVacationTypesQuery({ quiet: true })
  const effectiveTypes = useEffectiveTypesQuery({ quiet: true })
  const expirationTypes = useExpirationTypesQuery({ quiet: true })
  const company = useCompanyQuery({ quiet: true })
  const departments = useCompanyWithDepartmentsQuery(company.data?.company_id ?? '', { quiet: true })
  const approvalLimit = approvalLimitOf(departments.data?.departments)
  const companyId = company.data?.company_id ?? ''
  // 승인 상한을 아직 모르는가 — 받는 중이거나 읽지 못했다(권한이 없어 못 읽는 경우도 같다). 모르는 채로는 만들지 못하게 한다
  const approvalPending = company.isPending || (companyId !== '' && departments.isPending)
  const approvalFailed = company.isLoadingError || departments.isLoadingError

  const [method, setMethod] = useState<GrantMethod | null>(null)
  const [step, setStep] = useState<1 | 2>(1)
  const [byMethod, setByMethod] = useState<Partial<Record<GrantMethod, PolicyFormValues>>>({})
  const [seenOpen, setSeenOpen] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const [methodError, setMethodError] = useState(false)
  const [duplicate, setDuplicate] = useState(false)
  const [busy, setBusy] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  if (open !== seenOpen) {
    setSeenOpen(open)
    if (open) {
      setMethod(null)
      setStep(1)
      setByMethod({})
      setShowErrors(false)
      setMethodError(false)
      setDuplicate(false)
      setSaveError(null)
    }
  }

  const values = method ? (byMethod[method] ?? initialValues()) : initialValues()
  const set = <K extends keyof PolicyFormValues>(key: K, value: PolicyFormValues[K]) => {
    if (!method) return
    setByMethod((all) => ({ ...all, [method]: { ...(all[method] ?? initialValues()), [key]: value } }))
  }
  const errors = method ? validate(method, values) : {}
  const dirty = Object.values(byMethod).some((v) => JSON.stringify(v) !== JSON.stringify(initialValues()))
  const f = method ? fieldsOf(method) : null

  const listsFailed = vacationTypes.isLoadingError || effectiveTypes.isLoadingError || expirationTypes.isLoadingError
  const listsPending = vacationTypes.isPending || effectiveTypes.isPending || expirationTypes.isPending
  const approvalUnknown = method === 'ON_REQUEST' && (approvalPending || approvalFailed)

  const next = () => {
    if (!method) {
      setMethodError(true)
      return
    }
    setStep(2)
    setShowErrors(false)
  }

  const submit = async () => {
    if (!method || busy || listsPending || listsFailed || approvalUnknown) return
    if (Object.keys(errors).length > 0) {
      setShowErrors(true)
      return
    }
    setBusy(true)
    setSaveError(null)
    try {
      await post.mutateAsync(toPayload(method, values))
      onOpenChange(false)
      snackbar.show({ message: t('adminPolicy.created'), tone: 'positive' })
    } catch (error) {
      claimFailure(error)
      if (errorCode(error) === NAME_DUPLICATE_CODE) {
        setDuplicate(true)
      } else {
        const key = writeFailureKey(error)
        if (key) setSaveError(tc(key))
      }
    } finally {
      setBusy(false)
    }
  }

  const show = (key: keyof typeof errors) => showErrors && !!errors[key]
  const typeItems = (list: { code: string; name: string }[] | undefined) => (list ?? []).map((x) => <SelectItem key={x.code} value={x.code} label={x.name} />)

  const stepOne = (
    <Field label={t('adminPolicy.create.methodLabel')} labelHidden invalid={methodError} errorMessage={t('adminPolicy.create.methodRequired')}>
      <RadioBoxGroup
        value={method ?? ''}
        onValueChange={(v) => {
          // 이름 중복 오류는 그 이름에 대한 것 — 다른 방법의 (다른) 이름 칸에는 남기지 않는다
          if (v !== method) setDuplicate(false)
          setMethod(v as GrantMethod)
          setMethodError(false)
        }}
        aria-label={t('adminPolicy.create.methodLabel')}
        data-method-group
      >
        {GRANT_METHODS.map((m) => (
          <RadioBox key={m} value={m} label={grantMethodLabel(t, m)} description={t(`adminPolicy.create.methodDesc.${m}`)} data-method={m} />
        ))}
      </RadioBoxGroup>
    </Field>
  )

  const typesBlock = listsFailed ? (
    <ResultSection
      kind='failure'
      size='medium'
      title={t('adminPolicy.create.listsFailureTitle')}
      description={t('memberVacation.failureDescription')}
      primaryAction={{
        label: tc('retry'),
        onClick: () => {
          void vacationTypes.refetch()
          void effectiveTypes.refetch()
          void expirationTypes.refetch()
        },
      }}
    />
  ) : listsPending ? (
    <div className='flex flex-col gap-x6' data-lists-loading>
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} text='t5' className='block h-[40px] w-full' />
      ))}
    </div>
  ) : null

  const stepTwo = method && f && (
    <div className='flex flex-col gap-x6 pb-x2' data-policy-create-fields={method}>
      <Field label={t('adminPolicy.name')} showRequiredIndicator maxGraphemeCount={NAME_MAX} invalid={duplicate || show('name')} errorMessage={duplicate ? t('adminPolicy.nameDuplicate') : t('adminPolicy.nameRequired')}>
        <Input
          value={values.name}
          placeholder={t('adminPolicy.namePlaceholder')}
          onChange={(e) => {
            set('name', e.target.value)
            setDuplicate(false)
          }}
        />
      </Field>
      <Field label={t('adminPolicy.desc')} maxGraphemeCount={DESC_MAX}>
        <Textarea value={values.desc} placeholder={t('adminPolicy.descPlaceholder')} onChange={(e) => set('desc', e.target.value)} />
      </Field>
      {typesBlock ?? (
        <>
          <Field label={t('adminPolicy.create.vacationType')} showRequiredIndicator invalid={show('vacationType')} errorMessage={t('adminPolicy.create.vacationTypeRequired')}>
            <Select value={values.vacationType} onValueChange={(v) => set('vacationType', v)} placeholder={t('adminPolicy.create.vacationTypePlaceholder')} aria-invalid={show('vacationType') || undefined}>
              {typeItems(vacationTypes.data)}
            </Select>
          </Field>
          {f.repeat && (
            <>
              <Field label={t('adminPolicy.create.repeat')} showRequiredIndicator invalid={show('repeatUnit')} errorMessage={t('adminPolicy.create.repeatRequired')}>
                <Select
                  value={values.repeatUnit}
                  onValueChange={(v) => {
                    set('repeatUnit', v as PolicyFormValues['repeatUnit'])
                    set('month', '')
                    set('day', '')
                  }}
                  placeholder={t('adminPolicy.create.repeatPlaceholder')}
                  aria-invalid={show('repeatUnit') || undefined}
                >
                  {REPEAT_UNITS.map((u) => (
                    <SelectItem key={u} value={u} label={repeatUnitLabel(t, u)} />
                  ))}
                </Select>
              </Field>
              <Field label={t('adminPolicy.create.interval')} showRequiredIndicator description={t('adminPolicy.create.intervalHelp')}>
                <QuantityPicker value={values.repeatInterval} min={1} max={INTERVAL_MAX} onValueChange={(v) => set('repeatInterval', v)} aria-label={t('adminPolicy.create.interval')} />
              </Field>
              {dayRuleOf(values.repeatUnit) !== 'none' && (
                <Field
                  label={t('adminPolicy.create.when')}
                  description={dayRuleOf(values.repeatUnit) === 'monthDay' ? t('adminPolicy.create.whenYearlyHelp') : t('adminPolicy.create.whenDayHelp')}
                  invalid={show('month') || show('day')}
                  errorMessage={show('month') ? (values.month === '' ? t('adminPolicy.create.monthRequired') : t('adminPolicy.create.monthRange')) : t('adminPolicy.create.dayRange')}
                >
                  <div className='flex flex-wrap items-center gap-x3' data-when>
                    {dayRuleOf(values.repeatUnit) === 'monthDay' && (
                      <Input
                        rootClassName='w-[104px]'
                        inputMode='numeric'
                        aria-label={t('adminPolicy.create.monthAria')}
                        suffix={t('adminPolicy.create.monthUnit')}
                        value={values.month}
                        onChange={(e) => set('month', e.target.value.replace(/\D/g, '').slice(0, 2))}
                      />
                    )}
                    <Input
                      rootClassName='w-[104px]'
                      inputMode='numeric'
                      aria-label={t('adminPolicy.create.dayAria')}
                      suffix={t('adminPolicy.create.dayUnit')}
                      value={values.day}
                      onChange={(e) => set('day', e.target.value.replace(/\D/g, '').slice(0, 2))}
                    />
                  </div>
                </Field>
              )}
              <DayField
                label={t('adminPolicy.create.firstGrantDate')}
                placeholder={t('adminPolicy.create.datePlaceholder')}
                value={values.firstGrantDate}
                onValueChange={(d) => set('firstGrantDate', d)}
                invalid={show('firstGrantDate')}
                errorMessage={t('adminPolicy.create.firstGrantDateRequired')}
              />
              <Field label={t('adminPolicy.create.howMany')}>
                <RadioBoxGroup value={values.recurring} onValueChange={(v) => set('recurring', v as 'Y' | 'N')} aria-label={t('adminPolicy.create.howMany')} data-recurring-group>
                  <RadioBox value='Y' label={t('adminPolicy.create.forever')} description={t('adminPolicy.create.foreverDesc')} />
                  <RadioBox
                    value='N'
                    label={t('adminPolicy.create.limited')}
                    description={t('adminPolicy.create.limitedDesc')}
                    footer={
                      values.recurring === 'N' ? (
                        <QuantityPicker
                          value={values.maxGrantCount}
                          min={1}
                          max={MAX_COUNT_MAX}
                          onValueChange={(v) => set('maxGrantCount', v)}
                          aria-label={t('adminPolicy.create.maxCount')}
                          getValueText={(n) => t('adminPolicy.create.times', { count: n })}
                        />
                      ) : undefined
                    }
                  />
                </RadioBoxGroup>
              </Field>
            </>
          )}
          {f.flexible && (
            <Field label={t('adminPolicy.create.timeKind')}>
              <RadioBoxGroup value={values.flexible} onValueChange={(v) => set('flexible', v as 'N' | 'Y')} aria-label={t('adminPolicy.create.timeKind')} data-flexible-group>
                <RadioBox value='N' label={t('adminPolicy.create.fixed')} description={t('adminPolicy.create.fixedDesc')} />
                <RadioBox value='Y' label={t('adminPolicy.create.flexible')} description={t('adminPolicy.create.flexibleDesc')} />
              </RadioBoxGroup>
            </Field>
          )}
          {(method === 'REPEAT_GRANT' || values.flexible === 'N') && (
            <GrantTimeField
              label={t('adminPolicy.create.grantTime')}
              value={values.grantTime}
              onValueChange={(total) => set('grantTime', total)}
              withMinutes={values.minute}
              description={values.minute ? t('grantForm.timeHelpMinutes') : t('grantForm.timeHelp')}
              invalid={show('grantTime')}
              errorMessage={t('adminPolicy.create.grantTimeRequired')}
            />
          )}
          <Checkbox
            label={t('adminPolicy.create.minute')}
            checked={values.minute}
            onCheckedChange={(checked) => {
              set('minute', checked === true)
              if (checked !== true) set('grantTime', dropMinutes(values.grantTime))
            }}
          />
          {f.approval &&
            (approvalFailed ? (
              <ResultSection
                kind='failure'
                size='medium'
                title={t('adminPolicy.create.approvalFailureTitle')}
                description={t('adminPolicy.create.approvalFailureDescription')}
                primaryAction={{
                  label: tc('retry'),
                  onClick: () => {
                    void company.refetch()
                    void departments.refetch()
                  },
                  loading: company.isFetching || departments.isFetching,
                }}
              />
            ) : approvalPending ? (
              <Skeleton text='t5' className='block h-[40px] w-full' data-approval-loading />
            ) : (
              <Field label={t('adminPolicy.create.approval')} description={approvalLimit === 0 ? t('adminPolicy.create.approvalNone') : t('adminPolicy.create.approvalHelp')}>
                <QuantityPicker value={Math.min(values.approvalCount, approvalLimit)} min={0} max={approvalLimit} onValueChange={(v) => set('approvalCount', v)} aria-label={t('adminPolicy.create.approval')} />
              </Field>
            ))}
          <Field label={t('adminPolicy.create.validityStart')} showRequiredIndicator invalid={show('effectiveType')} errorMessage={t('adminPolicy.create.validityStartRequired')}>
            <Select value={values.effectiveType} onValueChange={(v) => set('effectiveType', v)} placeholder={t('adminPolicy.create.validityStartPlaceholder')} aria-invalid={show('effectiveType') || undefined}>
              {typeItems(effectiveTypes.data)}
            </Select>
          </Field>
          <Field label={t('adminPolicy.create.validityEnd')} showRequiredIndicator invalid={show('expirationType')} errorMessage={t('adminPolicy.create.validityEndRequired')}>
            <Select value={values.expirationType} onValueChange={(v) => set('expirationType', v)} placeholder={t('adminPolicy.create.validityEndPlaceholder')} aria-invalid={show('expirationType') || undefined}>
              {typeItems(expirationTypes.data)}
            </Select>
          </Field>
        </>
      )}
    </div>
  )

  return (
    <ResponsiveDialog open={open} form dirty={dirty} busy={busy} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent
        title={step === 1 || !method ? t('adminPolicy.create.step1Title') : grantMethodLabel(t, method)}
        description={step === 1 ? t('adminPolicy.create.step1Desc') : undefined}
        onBack={step === 2 ? () => setStep(1) : undefined}
      >
        <ResponsiveDialogBody>
          {saveError && (
            <Callout tone='critical' role='alert' className='mb-x4' data-save-failure>
              {saveError}
            </Callout>
          )}
          {step === 1 ? stepOne : stepTwo}
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          <ResponsiveDialogCancel>{tc('cancel')}</ResponsiveDialogCancel>
          {step === 1 ? (
            <Button onClick={next} data-policy-next>
              {tc('next')}
            </Button>
          ) : (
            <Button loading={busy} disabled={listsFailed || listsPending || approvalUnknown} onClick={() => void submit()} data-policy-submit>
              {t('adminPolicy.create.submit')}
            </Button>
          )}
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
