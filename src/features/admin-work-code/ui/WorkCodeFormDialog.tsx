import { useRef, useState } from 'react'
import { EllipsisVertical, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { claimFailure, writeFailureKey } from '@/shared/api/failure'
import { useLeaveConfirm } from '@/shared/ds/alert-dialog'
import { Button } from '@/shared/ds/button'
import { Callout } from '@/shared/ds/callout'
import { ResponsiveDialog, ResponsiveDialogBody, ResponsiveDialogCancel, ResponsiveDialogContent, ResponsiveDialogFooter } from '@/shared/ds/dialog'
import { Field } from '@/shared/ds/field'
import { dsText } from '@/shared/ds/i18n'
import { Input } from '@/shared/ds/input'
import { useInputButtonSurface } from '@/shared/ds/input-button'
import { ResponsiveMenu, ResponsiveMenuContent, ResponsiveMenuItem, ResponsiveMenuTrigger } from '@/shared/ds/menu'
import { useSnackbar } from '@/shared/ds/snackbar'
import { usePostCreateWorkCodeMutation, usePutUpdateWorkCodeMutation, type WorkCodeResp } from '@/entities/work'
import { emptyWorkCodeForm, parseOrder, workCodeFormChanged, workCodeFormErrors, workCodeFormOf, type WorkCodeFormValues, type WorkCodeRow } from '../lib/work-code-rows'

/** 폼이 무엇을 하나 — 새 코드(상위가 있으면 하위 코드) · 그 코드 수정 */
export type WorkCodeFormTarget = { kind: 'create'; parentId?: number } | { kind: 'edit'; row: WorkCodeRow }

/**
 * 업무 코드 폼(I-24 J 47) — ds Responsive Dialog `form`(1280 이상 480 · 미만 Bottom Sheet), 칸 코드 · 이름 · 순서, 바닥 [취소] [저장].
 * 폰(시트)에서 줄을 눌러 연 수정 시트: 묶음 줄은 머리 ⋮(하위 코드 추가 · 삭제), 그 밖 줄은 바닥 왼쪽 [삭제](10-25 줄 동작).
 */
export function WorkCodeFormDialog({
  open,
  target,
  onOpenChange,
  onSaved,
  onCloseAutoFocus,
  onDelete,
  onAddChild,
}: {
  open: boolean
  target: WorkCodeFormTarget
  onOpenChange: (open: boolean) => void
  onSaved: () => void
  onCloseAutoFocus?: (e: Event) => void
  /** 폰 수정 시트의 삭제 — 없으면 두지 않는다 */
  onDelete?: (row: WorkCodeRow) => void
  /** 폰 수정 시트 머리 ⋮ 의 하위 코드 추가 — 묶음 줄만 */
  onAddChild?: (row: WorkCodeRow) => void
}) {
  const { t } = useTranslation('work')
  const { t: tc } = useTranslation('common')
  const snackbar = useSnackbar()
  const sheet = useInputButtonSurface() === 'sheet'
  const editing = target.kind === 'edit'
  const initial = target.kind === 'edit' ? workCodeFormOf(target.row.code) : emptyWorkCodeForm()
  const [values, setValues] = useState<WorkCodeFormValues>(initial)
  const [showErrors, setShowErrors] = useState(false)
  const [busy, setBusy] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [duplicate, setDuplicate] = useState(false)
  const codeRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const pendingChild = useRef<WorkCodeRow | null>(null)
  const create = usePostCreateWorkCodeMutation()
  const update = usePutUpdateWorkCodeMutation()

  const set = <K extends keyof WorkCodeFormValues>(key: K, value: string) => {
    if (key === 'code') setDuplicate(false)
    setValues((v) => ({ ...v, [key]: value }))
  }
  const errors = workCodeFormErrors(values)
  const dirty = workCodeFormChanged(values, initial)
  const leave = useLeaveConfirm({ dirty, contentRef, leave: () => pendingChild.current && onAddChild?.(pendingChild.current) })

  const submit = async () => {
    if (busy) return
    if (errors.code || errors.name || errors.order) {
      setShowErrors(true)
      if (errors.code) codeRef.current?.focus()
      return
    }
    setBusy(true)
    setSaveError(null)
    try {
      const order = parseOrder(values.order) ?? 0
      if (target.kind === 'edit') {
        const code: WorkCodeResp = target.row.code
        await update.mutateAsync({
          work_code_id: code.work_code_id,
          work_code: values.code.trim(),
          work_code_name: values.name.trim(),
          parent_work_code_id: code.parent_work_code_id,
          order_seq: order,
        })
      } else {
        await create.mutateAsync({
          work_code: values.code.trim(),
          work_code_name: values.name.trim(),
          code_type: 'OPTION',
          parent_work_code_id: target.parentId,
          order_seq: order,
        })
      }
      onSaved()
      snackbar.show({ message: t('adminWorkCode.saved'), tone: 'positive' })
    } catch (error) {
      claimFailure(error)
      const key = writeFailureKey(error)
      if (key === 'failure.code.workCodeDuplicate') setDuplicate(true)
      else if (key) setSaveError(key === 'failure.write' ? t('adminWorkCode.saveFailed') : tc(key))
    } finally {
      setBusy(false)
    }
  }

  const row = target.kind === 'edit' ? target.row : null
  const rowName = row ? row.code.work_code_name : ''
  const headerAction =
    row && sheet && row.canAddChild && (onAddChild || onDelete) ? (
      <ResponsiveMenu>
        <ResponsiveMenuTrigger asChild>
          <Button variant='ghost' layout='iconOnly' size='medium' aria-label={dsText('common.moreFor', { label: rowName })} data-work-code-more>
            <EllipsisVertical />
          </Button>
        </ResponsiveMenuTrigger>
        <ResponsiveMenuContent title={rowName}>
          {onAddChild && (
            <ResponsiveMenuItem
              icon={<Plus />}
              label={t('addSubCode')}
              onSelect={() => {
                pendingChild.current = row
                leave.request()
              }}
            />
          )}
          {onDelete && <ResponsiveMenuItem icon={<Trash2 />} label={tc('delete')} tone='critical' onSelect={() => onDelete(row)} />}
        </ResponsiveMenuContent>
      </ResponsiveMenu>
    ) : undefined

  return (
    <ResponsiveDialog open={open} form dirty={dirty} busy={busy} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent
        ref={contentRef}
        title={editing ? t('codeEdit') : t('codeCreate')}
        headerAction={headerAction}
        onOpenAutoFocus={(e) => {
          if (editing) return
          e.preventDefault()
          codeRef.current?.focus({ preventScroll: true })
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
              label={t('adminWorkCode.fieldCode')}
              showRequiredIndicator
              invalid={(showErrors && !!errors.code) || duplicate}
              errorMessage={duplicate ? tc('failure.code.workCodeDuplicate') : t('codeRequired')}
            >
              <Input ref={codeRef} value={values.code} placeholder={t('codePlaceholder')} onChange={(e) => set('code', e.target.value)} />
            </Field>
            <Field label={t('adminWorkCode.fieldName')} showRequiredIndicator invalid={showErrors && !!errors.name} errorMessage={t('codeNameRequired')}>
              <Input value={values.name} placeholder={t('codeNamePlaceholder')} onChange={(e) => set('name', e.target.value)} />
            </Field>
            <Field label={t('adminWorkCode.fieldOrder')} invalid={showErrors && !!errors.order} errorMessage={t('adminWorkCode.orderInvalid')}>
              <Input type='number' inputMode='numeric' value={values.order} onChange={(e) => set('order', e.target.value)} />
            </Field>
          </div>
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          {row && sheet && onDelete && !headerAction && (
            <Button variant='ghost' ghostColor='critical' size='large' disabled={busy} onClick={() => onDelete(row)} data-work-code-delete>
              {tc('delete')}
            </Button>
          )}
          <ResponsiveDialogCancel>{tc('cancel')}</ResponsiveDialogCancel>
          <Button loading={busy} onClick={() => void submit()}>
            {tc('save')}
          </Button>
        </ResponsiveDialogFooter>
        {leave.node}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
