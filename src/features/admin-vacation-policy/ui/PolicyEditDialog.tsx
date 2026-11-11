import { useRef, useState } from 'react'
import { isAxiosError } from 'axios'
import { useTranslation } from 'react-i18next'

import { claimFailure, writeFailureKey } from '@/shared/api/failure'
import { Button } from '@/shared/ds/button'
import { Callout } from '@/shared/ds/callout'
import { Divider } from '@/shared/ds/divider'
import { ResponsiveDialog, ResponsiveDialogBody, ResponsiveDialogCancel, ResponsiveDialogContent, ResponsiveDialogFooter } from '@/shared/ds/dialog'
import { Field } from '@/shared/ds/field'
import { Input } from '@/shared/ds/input'
import { useSnackbar } from '@/shared/ds/snackbar'
import { Textarea } from '@/shared/ds/textarea'
import { ConfirmDialog } from '@/shared/ui/confirm'
import { useDeleteVacationPolicyMutation, usePutVacationPolicyMutation, type GetVacationPoliciesResp } from '@/entities/vacation-policy'
import { canDeletePolicy, policyRuleLine, policyValidityLine, type PolicyNames } from '../lib/policy-format'

const NAME_MAX = 50
const DESC_MAX = 1000
/** 서버가 같은 이름의 정책을 거절할 때의 코드(HrErrorCode VACATION_014 · 409) */
const NAME_DUPLICATE_CODE = 'VACATION_014'

const errorCode = (error: unknown): string | undefined =>
  isAxiosError(error) ? (error.response?.data as { code?: string } | undefined)?.code : undefined

/**
 * 휴가 정책 수정 폼(I-24 H 38) — 이름 · 설명만 고친다(부여 규칙은 읽기 전용: 이미 받은 휴가가 있는 정책이라 서버가 두 칸만 받는다).
 * 저장 = PUT /vacation-policies/{id}. 이름 중복(409 VACATION_014)은 이름 칸 아래 오류로(폼은 열린 채), 그 밖의 실패는 폼 맨 위 Callout.
 * 삭제는 바닥 왼쪽 [삭제](ghost critical) → 확인창. 기본 정책(can_deleted N)은 막힌 [삭제] + 이유 글. 확인창 실패는 폼이 뒤에 열려 있어 폼 위 Callout 으로 말한다.
 */
export function PolicyEditDialog({
  policy,
  open,
  onOpenChange,
  names,
}: {
  policy: GetVacationPoliciesResp | null
  open: boolean
  onOpenChange: (open: boolean) => void
  names: PolicyNames
}) {
  const { t, i18n } = useTranslation('vacation')
  const { t: tc } = useTranslation('common')
  const snackbar = useSnackbar()
  const put = usePutVacationPolicyMutation()
  const remove = useDeleteVacationPolicyMutation()
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [seenOpen, setSeenOpen] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const [duplicate, setDuplicate] = useState(false)
  const [busy, setBusy] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const deleted = useRef(false)

  // 열 때마다 그 정책의 값으로 처음부터 — 닫혔다 다시 열면 고치던 값이 남지 않는다
  if (open !== seenOpen) {
    setSeenOpen(open)
    if (open && policy) {
      setName(policy.vacation_policy_name)
      setDesc(policy.vacation_policy_desc ?? '')
      setShowErrors(false)
      setDuplicate(false)
      setSaveError(null)
      deleted.current = false
    }
  }

  const dirty = policy !== null && (name !== policy.vacation_policy_name || desc !== (policy.vacation_policy_desc ?? ''))
  const nameEmpty = name.trim() === ''
  const deletable = policy !== null && canDeletePolicy(policy)

  const submit = async () => {
    if (!policy || busy) return
    if (nameEmpty) {
      setShowErrors(true)
      return
    }
    setBusy(true)
    setSaveError(null)
    try {
      await put.mutateAsync({ vacationPolicyId: policy.vacation_policy_id, data: { vacation_policy_name: name.trim(), vacation_policy_desc: desc } })
      onOpenChange(false)
      snackbar.show({ message: t('adminPolicy.editSaved'), tone: 'positive' })
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

  const nameError = duplicate ? t('adminPolicy.nameDuplicate') : t('adminPolicy.nameRequired')

  return (
    <>
      <ResponsiveDialog open={open} form dirty={dirty} busy={busy} onOpenChange={onOpenChange}>
        <ResponsiveDialogContent title={t('adminPolicy.editTitle')}>
          <ResponsiveDialogBody>
            {saveError && (
              <Callout tone='critical' role='alert' className='mb-x4' data-save-failure>
                {saveError}
              </Callout>
            )}
            <div className='flex flex-col gap-x6 pb-x2' data-policy-edit>
              <Field label={t('adminPolicy.name')} showRequiredIndicator maxGraphemeCount={NAME_MAX} invalid={duplicate || (showErrors && nameEmpty)} errorMessage={nameError}>
                <Input
                  value={name}
                  placeholder={t('adminPolicy.namePlaceholder')}
                  onChange={(e) => {
                    setName(e.target.value)
                    setDuplicate(false)
                  }}
                />
              </Field>
              <Field label={t('adminPolicy.desc')} maxGraphemeCount={DESC_MAX}>
                <Textarea value={desc} placeholder={t('adminPolicy.descPlaceholder')} onChange={(e) => setDesc(e.target.value)} />
              </Field>
              <Divider />
              {policy && (
                <Field label={t('adminPolicy.rules')} description={t('adminPolicy.rulesHelp')} readOnly>
                  <div className='rounded-r3 bg-bg-disabled px-x4 py-x3 text-t5 font-normal text-fg-neutral-muted' data-policy-rules>
                    <p className='m-0 [overflow-wrap:break-word]'>{policyRuleLine(t, policy, names, i18n.language)}</p>
                    <p className='m-0 [overflow-wrap:break-word]'>{policyValidityLine(t, policy, names)}</p>
                  </div>
                </Field>
              )}
              {policy && !deletable && (
                <p id='policy-delete-blocked' className='m-0 text-t3 font-normal text-fg-neutral-subtle' data-delete-blocked>
                  {t('adminPolicy.deleteBlocked')}
                </p>
              )}
            </div>
          </ResponsiveDialogBody>
          <ResponsiveDialogFooter>
            <Button
              variant='ghost'
              ghostColor='critical'
              className='mr-auto max-[79.99rem]:!grow-0 max-[79.99rem]:!basis-auto'
              disabled={!deletable || busy}
              aria-describedby={deletable ? undefined : 'policy-delete-blocked'}
              onClick={() => setConfirmOpen(true)}
              data-policy-delete
            >
              {tc('delete')}
            </Button>
            <ResponsiveDialogCancel>{tc('cancel')}</ResponsiveDialogCancel>
            <Button loading={busy} onClick={() => void submit()}>
              {tc('save')}
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('policy.deleteTitle')}
        description={t('policy.deleteConfirm', { name: policy?.vacation_policy_name ?? '' })}
        onConfirm={async () => {
          if (!policy) return
          try {
            await remove.mutateAsync(policy.vacation_policy_id)
            deleted.current = true
          } catch (error) {
            // 폼이 뒤에 열려 있다 — 확인창을 닫고 폼 맨 위 Callout 으로 알린다(alert-dialog.md 예외)
            claimFailure(error)
            const key = writeFailureKey(error)
            if (key) setSaveError(key === 'failure.write' ? tc('failure.delete') : key === 'failure.writeInput' ? tc('failure.deleteInput') : key === 'failure.unconfirmed' ? tc('failure.deleteUnconfirmed') : tc(key))
          }
        }}
        onDone={() => {
          if (!deleted.current) return
          onOpenChange(false)
          snackbar.show({ message: t('adminPolicy.deleted'), tone: 'positive' })
        }}
      />
    </>
  )
}
