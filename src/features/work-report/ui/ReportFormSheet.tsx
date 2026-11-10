import { Copy } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ds/button'
import { Callout } from '@/shared/ds/callout'
import { ResponsiveDialog, ResponsiveDialogBody, ResponsiveDialogCancel, ResponsiveDialogContent, ResponsiveDialogFooter } from '@/shared/ds/dialog'
import { Field } from '@/shared/ds/field'
import { List, ListButtonItem } from '@/shared/ds/list'
import { QuantityPicker } from '@/shared/ds/quantity-picker'
import { Textarea } from '@/shared/ds/textarea'
import { DayRow } from '@/shared/ui/groo/day-row'
import { PickerRow } from '@/shared/ui/groo/picker-row'
import type { WorkCodeResp, WorkGroupWithParts } from '@/entities/work'
import type { DraftErrors } from '../lib/report-form'
import { draftChanged } from '../lib/report-form'
import { partsOf } from '../lib/report-format'
import { useReportContext } from '../model/ReportContext'
import type { WorkDraft } from '../model/types'
import { MAX_HOURS } from './ReportEditRow'

/** 고르기 줄 한 칸 — 줄 시트 안에 선택지 라디오처럼 눌러 고른다 */
function CodeRow({ title, placeholder, value, options, error, onPick, readOnly }: { title: string; placeholder: string; value: string; options: WorkCodeResp[]; error?: string; onPick: (code: string) => void; readOnly?: boolean }) {
  const current = options.find((o) => o.work_code === value)
  if (readOnly) return <PickerRow title={title} surfaceTitle={title} value='' placeholder={placeholder} readOnly />
  return (
    <PickerRow title={title} surfaceTitle={title} value={current?.work_code_name ?? ''} placeholder={placeholder} errorMessage={error} scrollFog>
      {({ close }) => (
        <List>
          {options.map((o) => (
            <ListButtonItem
              key={o.work_code}
              title={<span className='[overflow-wrap:break-word] [word-break:keep-all]'>{o.work_code_name}</span>}
              aria-pressed={value === o.work_code}
              data-work-code={o.work_code}
              onClick={() => {
                onPick(o.work_code)
                close()
              }}
            />
          ))}
        </List>
      )}
    </PickerRow>
  )
}

/**
 * 업무 추가 · 수정 시트(폰 — I-25 H 52) — 줄 칸 일자 → 담당자(보기만) → 업무 분류 · 업무 파트 · 업무 구분(줄 시트 고르기) → Field 소요 시간(Quantity Picker large 0 ~ 24) → Field 내용(Textarea).
 * 입력 폼이라 바깥 · 닫기에 작성 내용 확인(dirty). 검증은 칸 아래 오류 + 첫 오류 칸 초점. 쓰기 실패는 시트 맨 위 Callout(고정 글).
 * 수정이면 바닥 왼쪽 [삭제] · 머리 오른쪽 복제(고친 값이 없을 때만).
 */
export function ReportFormSheet({
  groups,
  divisions,
  errors,
  showErrors,
  failure,
  busy,
  onChange,
  onSave,
  onClose,
  onDelete,
  onDuplicate,
}: {
  groups: WorkGroupWithParts[]
  divisions: WorkCodeResp[]
  errors: DraftErrors
  showErrors: boolean
  failure: string | null
  busy: boolean
  onChange: (patch: Partial<WorkDraft>) => void
  onSave: () => void
  onClose: () => void
  onDelete?: () => void
  onDuplicate?: () => void
}) {
  const { t } = useTranslation('work')
  const { t: tc } = useTranslation('common')
  const { draft, draftBase } = useReportContext()
  if (!draft) return null
  const editing = draft.id !== undefined
  const dirty = draftBase ? draftChanged(draftBase, draft) : false
  const parts = partsOf(groups, draft.groupCode)
  const err = (k: keyof DraftErrors, msg: string) => (showErrors && errors[k] ? msg : undefined)

  return (
    <ResponsiveDialog open form dirty={dirty} busy={busy} onOpenChange={(o) => !o && onClose()}>
      <ResponsiveDialogContent
        title={t(editing ? 'rep.formEdit' : 'rep.formAdd')}
        headerAction={
          editing && onDuplicate ? (
            <Button variant='ghost' layout='iconOnly' size='medium' aria-label={t('rep.duplicate')} disabled={busy || dirty} onClick={onDuplicate} data-sheet-duplicate>
              <Copy />
            </Button>
          ) : undefined
        }
      >
        <ResponsiveDialogBody>
          <div className='flex flex-col gap-x6 pb-x2' data-report-form>
            {failure && (
              <Callout tone='critical' role='alert' data-save-failure>
                {failure}
              </Callout>
            )}
            <div className='-mx-x6 flex flex-col' data-report-rows>
              <DayRow title={t('rep.fDate')} value={draft.date} onChange={(v) => onChange({ date: v })} placeholder={t('rep.datePlaceholder')} error={err('date', t('rep.errDate'))} />
              <PickerRow title={t('rep.fManager')} surfaceTitle={t('rep.fManager')} value={draft.managerName} readOnly />
              <CodeRow title={t('rep.fGroup')} placeholder={t('rep.groupPlaceholder')} value={draft.groupCode} options={groups} error={err('group', t('rep.errGroup'))} onPick={(code) => onChange({ groupCode: code, partCode: '' })} />
              <CodeRow title={t('rep.fPart')} placeholder={draft.groupCode ? t('rep.partPlaceholder') : t('rep.partNeedGroup')} value={draft.partCode} options={parts} readOnly={!draft.groupCode} error={err('part', t('rep.errPart'))} onPick={(code) => onChange({ partCode: code })} />
              <CodeRow title={t('rep.fDivision')} placeholder={t('rep.divisionPlaceholder')} value={draft.divisionCode} options={divisions} error={err('division', t('rep.errDivision'))} onPick={(code) => onChange({ divisionCode: code })} />
            </div>
            <Field label={t('rep.fHours')}>
              <QuantityPicker
                size='large'
                aria-label={t('rep.fHours')}
                value={draft.hours}
                min={0}
                max={MAX_HOURS}
                getValueText={(n) => t('rep.hoursValue', { count: n })}
                decrementAriaLabel={t('rep.hoursDecrease')}
                incrementAriaLabel={t('rep.hoursIncrease')}
                onValueChange={(n) => onChange({ hours: n })}
              />
            </Field>
            <Field label={t('rep.fContent')}>
              <Textarea value={draft.content} placeholder={t('rep.contentPlaceholder')} onChange={(e) => onChange({ content: e.target.value })} />
            </Field>
          </div>
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          {editing && onDelete && (
            <Button variant='ghost' ghostColor='critical' size='large' disabled={busy} onClick={onDelete} data-sheet-delete>
              {tc('delete')}
            </Button>
          )}
          <ResponsiveDialogCancel>{tc('cancel')}</ResponsiveDialogCancel>
          <Button variant='neutralSolid' loading={busy} onClick={onSave} data-sheet-save>
            {tc('save')}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
