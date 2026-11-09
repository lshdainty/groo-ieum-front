import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { claimFailure, writeFailureKey } from '@/shared/api/failure'
import { Button } from '@/shared/ds/button'
import { Callout } from '@/shared/ds/callout'
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogCancel,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
} from '@/shared/ds/dialog'
import { Field } from '@/shared/ds/field'
import { Input } from '@/shared/ds/input'
import { useSnackbar } from '@/shared/ds/snackbar'
import { Textarea } from '@/shared/ds/textarea'
import { usePostCompanyMutation, usePutCompanyMutation, type GetCompanyResp } from '@/entities/company'

const ID_MAX = 50
const NAME_MAX = 100
const DESC_MAX = 1000

interface Values {
  id: string
  name: string
  desc: string
}

/**
 * 회사 만들기 · 회사 정보 수정(D 17) — ds Responsive Dialog `form`(1280 이상 Dialog 480 · 미만 Bottom Sheet), 바닥 [취소][저장].
 * 칸: 회사 ID(만들 때만 치고, 수정에서는 읽기 전용) · 회사 이름 · 회사 소개. 칸 오류는 누를 때 칸 아래, 저장 실패는 폼 맨 위 Callout(고정 글).
 * 필수가 칸의 2/3 라서 선택 칸(소개)에 "선택사항"을 단다(Field 2/3 규칙). 바뀐 채 닫으면 "작성한 내용이 사라져요".
 */
export function CompanyFormDialog({
  open,
  onOpenChange,
  company,
  onCloseAutoFocus,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 있으면 수정, 없으면 만들기 */
  company?: GetCompanyResp | null
  onCloseAutoFocus?: (e: Event) => void
}) {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const snackbar = useSnackbar()
  const editing = !!company
  const initial: Values = { id: company?.company_id ?? '', name: company?.company_name ?? '', desc: company?.company_desc ?? '' }
  const [values, setValues] = useState<Values>(initial)
  const [showErrors, setShowErrors] = useState(false)
  const [busy, setBusy] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const idRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const post = usePostCompanyMutation()
  const put = usePutCompanyMutation()

  const set = <K extends keyof Values>(key: K, value: Values[K]) => setValues((v) => ({ ...v, [key]: value }))
  const idError = !editing && values.id.trim() === ''
  const nameError = values.name.trim() === ''
  const dirty = values.id !== initial.id || values.name !== initial.name || values.desc !== initial.desc

  const submit = async () => {
    if (busy) return
    if (idError || nameError) {
      setShowErrors(true)
      if (idError) idRef.current?.focus()
      else nameRef.current?.focus()
      return
    }
    setBusy(true)
    setSaveError(null)
    try {
      if (editing && company) {
        await put.mutateAsync({ companyId: company.company_id, data: { company_name: values.name.trim(), company_desc: values.desc } })
        snackbar.show({ message: t('company.saved'), tone: 'positive' })
      } else {
        await post.mutateAsync({ company_id: values.id.trim(), company_name: values.name.trim(), company_desc: values.desc })
        snackbar.show({ message: t('company.created'), tone: 'positive' })
      }
      onOpenChange(false)
    } catch (error) {
      claimFailure(error)
      const key = writeFailureKey(error)
      if (key) setSaveError(key === 'failure.write' ? t('company.saveFailed') : tc(key))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ResponsiveDialog open={open} form dirty={dirty} busy={busy} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent
        title={editing ? t('company.editTitle') : t('company.createTitle')}
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          ;(editing ? nameRef : idRef).current?.focus({ preventScroll: true })
        }}
        onCloseAutoFocus={onCloseAutoFocus}
      >
        <ResponsiveDialogBody>
          {saveError && (
            <Callout tone='critical' role='alert' className='mb-x4' data-save-failure>
              {saveError}
            </Callout>
          )}
          <div className='flex flex-col gap-x6 pb-x2'>
            <Field
              label={t('company.companyId')}
              showRequiredIndicator={!editing}
              disabled={editing}
              invalid={showErrors && idError}
              errorMessage={t('company.companyIdRequired')}
              maxGraphemeCount={ID_MAX}
            >
              <Input ref={idRef} value={values.id} disabled={editing} onChange={(e) => set('id', e.target.value.slice(0, ID_MAX))} maxLength={ID_MAX} />
            </Field>
            <Field
              label={t('company.companyName')}
              showRequiredIndicator
              invalid={showErrors && nameError}
              errorMessage={t('company.companyNameRequired')}
              maxGraphemeCount={NAME_MAX}
            >
              <Input ref={nameRef} value={values.name} onChange={(e) => set('name', e.target.value.slice(0, NAME_MAX))} maxLength={NAME_MAX} />
            </Field>
            <Field label={t('company.companyIntro')} indicator={tc('optional')} maxGraphemeCount={DESC_MAX}>
              <Textarea value={values.desc} onChange={(e) => set('desc', e.target.value.slice(0, DESC_MAX))} maxLength={DESC_MAX} />
            </Field>
          </div>
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          <ResponsiveDialogCancel>{tc('cancel')}</ResponsiveDialogCancel>
          <Button loading={busy} onClick={() => void submit()}>
            {tc('save')}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
