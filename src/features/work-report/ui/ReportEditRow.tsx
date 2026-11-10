import { useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ds/button'
import { Callout } from '@/shared/ds/callout'
import { Field } from '@/shared/ds/field'
import { Input } from '@/shared/ds/input'
import { QuantityPicker } from '@/shared/ds/quantity-picker'
import { Select, SelectItem } from '@/shared/ds/select'
import { TableCell, TableRow } from '@/shared/ds/table'
import { DayField } from '@/shared/ui/groo/day-field'
import type { WorkCodeResp, WorkGroupWithParts } from '@/entities/work'
import type { DraftErrors } from '../lib/report-form'
import { partsOf } from '../lib/report-format'
import type { WorkDraft } from '../model/types'

/** 소요 시간 상한 — 지금 그대로(0 ~ 24) */
export const MAX_HOURS = 24

/**
 * 표 안 편집 줄(데스크톱 — I-25 H 52) — 한 줄 전체 폭(colSpan) · 바탕 bg-layer-default-pressed. 첫 줄 칸: 일자 · 담당자(읽기 전용) · 업무 분류 · 업무 파트 · 업무 구분 · 소요 시간(Quantity Picker 0 ~ 24),
 * 둘째 줄: 내용 + [취소] [저장]. 검증은 칸 아래 오류 + 첫 오류 칸 초점(토스트 없음). 쓰기 실패는 줄 맨 위 Callout 한 줄(고정 글).
 * Select · 날짜 칸 · Quantity Picker 는 ds 에 small 36 이 없어 medium 40 으로 맞췄다.
 */
export function ReportEditRow({
  colSpan,
  draft,
  groups,
  divisions,
  errors,
  showErrors,
  failure,
  busy,
  onChange,
  onSave,
  onCancel,
}: {
  colSpan: number
  draft: WorkDraft
  groups: WorkGroupWithParts[]
  divisions: WorkCodeResp[]
  errors: DraftErrors
  showErrors: boolean
  failure: string | null
  busy: boolean
  onChange: (patch: Partial<WorkDraft>) => void
  onSave: () => void
  onCancel: () => void
}) {
  const { t } = useTranslation('work')
  const { t: tc } = useTranslation('common')
  const parts = partsOf(groups, draft.groupCode)
  const root = useRef<HTMLDivElement>(null)
  const err = (k: keyof DraftErrors) => showErrors && errors[k]

  return (
    <TableRow data-report-edit data-edit-id={draft.id ?? 'new'}>
      <TableCell colSpan={colSpan} className='whitespace-normal bg-bg-layer-default-pressed py-x4'>
        <div ref={root} className='flex min-w-0 flex-col gap-x3' aria-busy={busy || undefined}>
          {failure && (
            <Callout tone='critical' role='alert' data-save-failure>
              {failure}
            </Callout>
          )}
          <div className='flex flex-wrap items-start gap-x3'>
            <div className='w-[170px]'>
              <DayField
                size='medium'
                label={t('rep.fDate')}
                value={draft.date}
                onValueChange={(v) => onChange({ date: v })}
                placeholder={t('rep.datePlaceholder')}
                invalid={err('date')}
                errorMessage={t('rep.errDate')}
              />
            </div>
            <div className='w-[140px]'>
              <Field label={t('rep.fManager')} readOnly>
                <Input size='medium' readOnly value={draft.managerName} />
              </Field>
            </div>
            <div className='w-[190px]'>
              <Field label={t('rep.fGroup')} showRequiredIndicator invalid={err('group')} errorMessage={t('rep.errGroup')}>
                <Select
                  size='medium'
                  placeholder={t('rep.groupPlaceholder')}
                  value={draft.groupCode}
                  aria-invalid={err('group') || undefined}
                  onValueChange={(v) => onChange({ groupCode: v, partCode: '' })}
                >
                  {groups.map((g) => (
                    <SelectItem key={g.work_code} value={g.work_code} label={g.work_code_name} />
                  ))}
                </Select>
              </Field>
            </div>
            <div className='w-[220px]'>
              <Field label={t('rep.fPart')} showRequiredIndicator invalid={err('part')} errorMessage={t('rep.errPart')}>
                <Select
                  size='medium'
                  placeholder={draft.groupCode ? t('rep.partPlaceholder') : t('rep.partNeedGroup')}
                  disabled={!draft.groupCode}
                  value={draft.partCode}
                  aria-invalid={err('part') || undefined}
                  onValueChange={(v) => onChange({ partCode: v })}
                >
                  {parts.map((p) => (
                    <SelectItem key={p.work_code} value={p.work_code} label={p.work_code_name} />
                  ))}
                </Select>
              </Field>
            </div>
            <div className='w-[190px]'>
              <Field label={t('rep.fDivision')} showRequiredIndicator invalid={err('division')} errorMessage={t('rep.errDivision')}>
                <Select
                  size='medium'
                  placeholder={t('rep.divisionPlaceholder')}
                  value={draft.divisionCode}
                  aria-invalid={err('division') || undefined}
                  onValueChange={(v) => onChange({ divisionCode: v })}
                >
                  {divisions.map((d) => (
                    <SelectItem key={d.work_code} value={d.work_code} label={d.work_code_name} />
                  ))}
                </Select>
              </Field>
            </div>
            <div>
              <Field label={t('rep.fHours')}>
                <QuantityPicker
                  size='medium'
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
            </div>
          </div>
          <div className='flex items-end gap-x3'>
            <div className='min-w-0 flex-1'>
              <Field label={t('rep.fContent')}>
                <Input size='medium' value={draft.content} placeholder={t('rep.contentPlaceholder')} onChange={(e) => onChange({ content: e.target.value })} />
              </Field>
            </div>
            <Button variant='neutralWeak' size='small' disabled={busy} onClick={onCancel} data-edit-cancel>
              {tc('cancel')}
            </Button>
            <Button variant='neutralSolid' size='small' loading={busy} onClick={onSave} data-edit-save>
              {tc('save')}
            </Button>
          </div>
        </div>
      </TableCell>
    </TableRow>
  )
}
