import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ds/button'
import { Callout } from '@/shared/ds/callout'
import { ResponsiveDialog, ResponsiveDialogBody, ResponsiveDialogCancel, ResponsiveDialogContent, ResponsiveDialogFooter } from '@/shared/ds/dialog'
import { Field } from '@/shared/ds/field'
import { Input } from '@/shared/ds/input'
import { useSnackbar } from '@/shared/ds/snackbar'
import { useCountryCodeTypesQuery, type TypeResp } from '@/entities/type'
import { useUserIdDuplicateQuery, usePostUserInviteMutation, usePutInvitedUserMutation } from '@/entities/user'
import { DayField } from '@/shared/ui/groo/day-field'
import { CompanyField, CountryField, WorkTimeField } from '@/shared/ui/groo/user-select-fields'
import { readWriteFailure } from '@/shared/ui/groo/write-error'

interface InitialData {
  user_id: string
  user_name: string
  user_email: string
  user_company_type: string
  user_work_time: string
  join_date: string
  country_code: string
}

interface UserInviteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  companyOptions: TypeResp[]
  initialData?: InitialData
}

interface Values {
  id: string
  name: string
  email: string
  joinDate: string
  company: string
  workTime: string
  country: string
}

/**
 * 사용자 초대 · 초대 정보 수정(I-24 F 29) — Responsive Dialog `form`, 바닥 [취소][초대 | 저장]. 칸 차례는 지금 그대로(이름 · 아이디 · 메일 · 입사일 ·
 * 회사 · 근무 시간 · 국가). 아이디 중복은 칸을 떠난 뒤 확인한다 — 확인하는 동안 설명 "확인하는 중…", 중복이면 칸 오류 + 제출 막음
 * (지금 `useUserIdDuplicateQuery` 길 그대로, 칸을 떠난 아이디로만 묻는다). 서버가 막은 중복(아이디 · 이메일 코드)은 그 칸 아래.
 */
const UserInviteDialog = ({ open, onOpenChange, title, companyOptions, initialData }: UserInviteDialogProps) => {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const snackbar = useSnackbar()
  const edit = !!initialData?.user_id
  const { data: countries = [] } = useCountryCodeTypesQuery()
  const { mutateAsync: invite } = usePostUserInviteMutation()
  const { mutateAsync: updateInvited } = usePutInvitedUserMutation()
  const [initial] = useState<Values>(() => ({
    id: initialData?.user_id ?? '',
    name: initialData?.user_name ?? '',
    email: initialData?.user_email ?? '',
    joinDate: initialData?.join_date ?? '',
    company: initialData?.user_company_type || companyOptions[0]?.code || '',
    workTime: initialData?.user_work_time || '9 ~ 18',
    country: initialData?.country_code || 'KR',
  }))
  const [values, setValues] = useState<Values>(initial)
  const [checkedId, setCheckedId] = useState('')
  const [serverIdTaken, setServerIdTaken] = useState(false)
  const [serverEmailTaken, setServerEmailTaken] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const [busy, setBusy] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const dup = useUserIdDuplicateQuery(checkedId)

  const set = <K extends keyof Values>(key: K, v: Values[K]) => setValues((cur) => ({ ...cur, [key]: v }))
  const idTrim = values.id.trim()
  const checking = !!checkedId && checkedId === idTrim && dup.isFetching
  const idTaken = (!!checkedId && checkedId === idTrim && dup.data?.duplicate === true) || serverIdTaken
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)
  const errors = {
    id: !values.id.trim(),
    name: !values.name.trim(),
    email: !emailOk,
    joinDate: !values.joinDate,
    company: !values.company,
    workTime: !values.workTime,
    country: !values.country,
  }
  const dirty = JSON.stringify(values) !== JSON.stringify(initial)

  const leaveId = () => {
    const id = values.id.trim()
    if (!edit && id) setCheckedId(id)
  }

  const submit = async () => {
    if (busy || checking) return
    if (Object.values(errors).some(Boolean) || idTaken) {
      setShowErrors(true)
      return
    }
    setBusy(true)
    setSaveError(null)
    try {
      const body = {
        user_id: values.id.trim(),
        user_name: values.name.trim(),
        user_email: values.email.trim(),
        user_company_type: values.company,
        user_work_time: values.workTime,
        join_date: values.joinDate,
        country_code: values.country,
      }
      if (edit) await updateInvited(body)
      else await invite(body)
      onOpenChange(false)
      snackbar.show({ message: edit ? t('users.inviteEdited') : t('users.invited'), tone: 'positive' })
    } catch (error) {
      const { code, key } = readWriteFailure(error)
      if (code === 'USER_002') setServerIdTaken(true)
      else if (code === 'USER_005') setServerEmailTaken(true)
      else if (key) setSaveError(tc(key))
    } finally {
      setBusy(false)
    }
  }

  const idError = errors.id ? t('user.userIdRequired') : t('users.idTaken')
  return (
    <ResponsiveDialog open={open} form dirty={dirty} busy={busy} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent title={title}>
        <ResponsiveDialogBody>
          {saveError && (
            <Callout tone='critical' role='alert' className='mb-x4' data-save-failure>
              {saveError}
            </Callout>
          )}
          <div className='flex flex-col gap-x6 pb-x2'>
            <Field label={t('user.userName')} showRequiredIndicator invalid={showErrors && errors.name} errorMessage={t('user.userNameRequired')}>
              <Input value={values.name} onChange={(e) => set('name', e.target.value)} />
            </Field>
            <Field
              label={t('user.userId')}
              showRequiredIndicator
              readOnly={edit}
              invalid={(showErrors && errors.id) || idTaken}
              errorMessage={idError}
              description={checking ? t('users.idChecking') : undefined}
            >
              <Input
                value={values.id}
                readOnly={edit}
                autoCapitalize='none'
                onChange={(e) => {
                  setServerIdTaken(false)
                  set('id', e.target.value)
                }}
                onBlur={leaveId}
              />
            </Field>
            <Field
              label={t('user.userEmail')}
              showRequiredIndicator
              invalid={(showErrors && errors.email) || serverEmailTaken}
              errorMessage={serverEmailTaken ? tc('failure.code.duplicateEmail') : t('user.userEmailRequired')}
            >
              <Input
                type='email'
                inputMode='email'
                value={values.email}
                onChange={(e) => {
                  setServerEmailTaken(false)
                  set('email', e.target.value)
                }}
              />
            </Field>
            <DayField label={t('user.joinDate')} placeholder={t('user.joinDatePlaceholder')} value={values.joinDate} onValueChange={(d) => set('joinDate', d)} invalid={showErrors && errors.joinDate} errorMessage={t('user.joinDateRequired')} />
            <CompanyField value={values.company} onValueChange={(v) => set('company', v)} options={companyOptions} required invalid={showErrors && errors.company} />
            <WorkTimeField value={values.workTime} onValueChange={(v) => set('workTime', v)} required invalid={showErrors && errors.workTime} />
            <CountryField value={values.country} onValueChange={(v) => set('country', v)} options={countries} required invalid={showErrors && errors.country} />
          </div>
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          <ResponsiveDialogCancel>{tc('cancel')}</ResponsiveDialogCancel>
          <Button loading={busy} disabled={checking} onClick={() => void submit()}>
            {edit ? tc('save') : t('user.invite')}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

export { UserInviteDialog }
