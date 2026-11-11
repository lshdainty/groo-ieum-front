import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/shared/ds/badge'
import { Button } from '@/shared/ds/button'
import { Callout } from '@/shared/ds/callout'
import { ResponsiveDialog, ResponsiveDialogBody, ResponsiveDialogCancel, ResponsiveDialogContent, ResponsiveDialogFooter } from '@/shared/ds/dialog'
import { Field } from '@/shared/ds/field'
import { BottomSheet, BottomSheetBody, BottomSheetContent, BottomSheetFooter } from '@/shared/ds/bottom-sheet'
import { List, ListButtonItem, ListItem } from '@/shared/ds/list'
import { Select, SelectItem } from '@/shared/ds/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ds/table'
import { focusSearchableList } from '@/shared/ds/searchable-list'
import { Textarea } from '@/shared/ds/textarea'
import { useSnackbar } from '@/shared/ds/snackbar'
import { readWriteFailure } from '@/shared/ui/groo/write-error'
import type { GetUsersResp } from '@/entities/user'
import type { CreateWorkHistoryReq, WorkCodeResp, WorkGroupWithParts } from '@/entities/work'
import { useWide } from '@/widgets/layout/lib/use-wide'
import { fixRow, importPayload, parseImportRows, type ImportContext, type ImportFix, type ImportRow } from '../lib/excel-import'
import { partsOf } from '../lib/report-format'
import { PersonList, PersonPick } from './ImportFixControls'
import { PickerRow } from '@/shared/ui/groo/picker-row'

const WORD = '[overflow-wrap:break-word] [word-break:keep-all]'

/** 고치기 시트의 고르기 줄 — 줄 시트 안에 선택지 줄을 눌러 고른다(업무 보고 시트의 CodeRow 와 같은 모양) */
function CodePick({ title, placeholder, value, options, error, disabled, onPick }: { title: string; placeholder: string; value: string; options: WorkCodeResp[]; error?: string; disabled: boolean; onPick: (code: string) => void }) {
  const current = options.find((o) => o.work_code === value)
  if (disabled) return <PickerRow title={title} surfaceTitle={title} value={current?.work_code_name ?? ''} placeholder={placeholder} errorMessage={error} readOnly />
  return (
    <PickerRow title={title} surfaceTitle={title} value={current?.work_code_name ?? ''} placeholder={placeholder} errorMessage={error} scrollFog>
      {({ close }) => (
        <List>
          {options.map((o) => (
            <ListButtonItem
              key={o.work_code}
              title={<span className={WORD}>{o.work_code_name}</span>}
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
 * 엑셀로 가져오기(I-25 H 45 · Q1 사용자 결정 11-10) — 1280 이상 대화상자 800(확인 단계는 표) · 미만 시트 480(확인 단계는 줄 목록 — 768 ~ 1279 데스크톱도 같다). 3단계: ① 붙여 넣기 → ② 확인하기 → ③ 등록.
 * 확인 단계는 줄마다 상태(오류 · 확인)와 고칠 것을 보인다 — 오류가 남으면 [N줄 등록] 은 막힌다. 25-4b(사용자 결정 11-10 "B 틀린 줄만 고르기"): 맞는 줄은 읽기 전용,
 * 틀린 줄의 틀린 칸(담당자 · 업무 분류 · 업무 파트 · 업무 구분)만 그 자리에서 고르기 칸이 되고 고르면 그 줄을 바로 다시 검증한다(폰은 오류 줄을 눌러 고치기 시트).
 * 일자 · 시간 · 내용은 고칠 수 없어 이전 단계에서 글을 고친다. 담당자 칸은 `WORK:MANAGE` 일 때만(없으면 나로 고정이라 남의 이름 줄은 빼기만).
 * 담당자: `WORK:MANAGE` 는 파일의 이름으로 사람을 찾고, 없으면 담당자는 나로 고정이라 **파일에 남의 이름이 있으면 그 줄을 오류로 보인다**
 * (서버가 남의 이름으로 만들기를 거절하고, 일괄은 한 줄이라도 걸리면 전체를 거절하므로 화면이 올리기 전에 막는다).
 * 등록 실패는 대화상자 맨 위 Callout(폼이 열린 흐름) — 고쳐서 다시 등록한다.
 */
export function ExcelImportDialog({
  open,
  onClose,
  groups,
  divisions,
  users,
  codes,
  me,
  canManage,
  onRegister,
  registering,
}: {
  open: boolean
  onClose: () => void
  groups: WorkGroupWithParts[]
  divisions: WorkCodeResp[]
  users: { data: GetUsersResp[]; failed: boolean; fetching: boolean; refetch: () => void }
  /** 분류 · 구분 목록 — 못 받았거나 아직이면 확인 단계로 못 넘어간다(모든 줄이 "없는 분류" 로 잘못 안내되지 않게) */
  codes: { ready: boolean; failed: boolean; fetching: boolean; refetch: () => void }
  me: { id: string; name: string }
  canManage: boolean
  onRegister: (rows: CreateWorkHistoryReq[]) => Promise<unknown>
  registering: boolean
}) {
  const { t } = useTranslation('work')
  const { t: tc } = useTranslation('common')
  const snackbar = useSnackbar()
  const wide = useWide()
  const [step, setStep] = useState<'input' | 'preview'>('input')
  const [text, setText] = useState('')
  const [delimiter, setDelimiter] = useState<string>('\t')
  const [rows, setRows] = useState<ImportRow[]>([])
  const [empty, setEmpty] = useState(false)
  const [failureKey, setFailureKey] = useState<string | null>(null)

  const usersBlocked = canManage && users.failed
  const codesBlocked = !codes.ready
  const errorCount = rows.filter((r) => r.errors.length > 0).length

  const [fixingId, setFixingId] = useState<number | null>(null)
  const ctx: ImportContext = { groups, divisions, users: users.data, me, canManage }
  const fix = (id: number, patch: ImportFix) => setRows((prev) => prev.map((r) => (r.id === id ? fixRow(r, patch, ctx) : r)))

  const verify = () => {
    const parsed = parseImportRows(text, delimiter, { ...ctx, header: [t('rep.colDate'), t('rep.colManager'), t('rep.colGroup'), t('rep.colPart'), t('rep.colDivision'), t('rep.colHours'), t('rep.colContent')] })
    if (parsed.length === 0) {
      setEmpty(true)
      return
    }
    setEmpty(false)
    setFixingId(null)
    setRows(parsed)
    setStep('preview')
  }

  const register = async () => {
    if (errorCount > 0 || registering) return
    setFailureKey(null)
    try {
      await onRegister(importPayload(rows))
      snackbar.show({ message: t('rep.xRegistered', { count: rows.length }), tone: 'positive' })
      onClose()
    } catch (error) {
      setFailureKey(readWriteFailure(error).key ?? 'failure.write')
    }
  }

  const fixingRow = fixingId === null ? undefined : rows.find((r) => r.id === fixingId)
  const fieldLabel = (field: string, r: ImportRow) => `${field}, ${r.date} ${r.userName}`
  /** 이유마다 한 줄씩 — 이어 붙인 한 문장이 "·" 로 시작하거나 줄 끝에서 끊기지 않게 */
  const errorLines = (r: ImportRow) =>
    r.errors.map((k) => (
      <span key={k} className='block' data-import-error-line>
        {t(`rep.${k}`)}
      </span>
    ))
  const statusBadge = (r: ImportRow) => (
    <Badge tone={r.errors.length > 0 ? 'critical' : 'positive'} className='whitespace-nowrap'>
      {r.errors.length > 0 ? t('rep.xBadgeError') : t('rep.xBadgeOk')}
    </Badge>
  )
  const drop = (id: number) => {
    setRows((prev) => prev.filter((r) => r.id !== id))
    setFixingId(null)
  }
  const dropButton = (r: ImportRow) => (
    <Button variant='ghost' size='small' aria-label={t('rep.xDropRow', { date: r.date, name: r.userName })} onClick={() => drop(r.id)} data-import-drop>
      {t('rep.xDrop')}
    </Button>
  )

  return (
    <ResponsiveDialog open={open} form dirty={text.trim() !== ''} busy={registering} onOpenChange={(o) => !o && onClose()}>
      <ResponsiveDialogContent title={t('rep.xTitle')} description={step === 'input' ? t('rep.xStep1') : t('rep.xStep2')} size='large'>
        <ResponsiveDialogBody>
          <div className='flex flex-col gap-x4 pb-x2' data-import-step={step}>
            {failureKey && (
              <Callout tone='critical' role='alert' data-save-failure>
                {tc(failureKey)}
              </Callout>
            )}
            {usersBlocked && (
              <Callout tone='critical' role='alert' data-users-failed>
                <span className='block'>{t('rep.xUsersFailed')}</span>
                <Button variant='ghost' size='small' flush='left' loading={users.fetching} onClick={users.refetch} data-users-retry>
                  {tc('retry')}
                </Button>
              </Callout>
            )}
            {codes.failed && (
              <Callout tone='critical' role='alert' data-codes-failed>
                <span className='block'>{t('rep.xCodesFailed')}</span>
                <Button variant='ghost' size='small' flush='left' loading={codes.fetching} onClick={codes.refetch} data-codes-retry>
                  {tc('retry')}
                </Button>
              </Callout>
            )}
            {step === 'input' ? (
              <>
                <p className='m-0 text-t4 text-fg-neutral-muted'>{canManage ? t('rep.xInputHint') : t('rep.xInputHintMine')}</p>
                <Field label={t('rep.xDelimiter')}>
                  <Select size='responsive' aria-label={t('rep.xDelimiter')} value={delimiter} onValueChange={setDelimiter} className='w-[10rem]'>
                    <SelectItem value={'\t'} label={t('rep.xTab')} />
                    <SelectItem value=',' label={t('rep.xComma')} />
                  </Select>
                </Field>
                <Field label={t('rep.xPasteLabel')} invalid={empty} errorMessage={t('rep.xEmpty')}>
                  <Textarea
                    className='min-h-[220px] font-mono'
                    value={text}
                    aria-invalid={empty || undefined}
                    placeholder={['2026-11-02', canManage ? t('rep.xSampleName') : me.name, 'SF/내부과제', '[G1]신규 운영 시스템 조기 안정화', '프로그램 개발', '8', t('rep.xSampleContent')].join(delimiter)}
                    onChange={(e) => {
                      setText(e.target.value)
                      setEmpty(false)
                    }}
                    data-import-text
                  />
                </Field>
              </>
            ) : (
              <>
                {errorCount > 0 && (
                  <Callout tone='critical' role='alert' data-import-errors>
                    {t('rep.xErrorsCallout', { count: errorCount })}
                    {!wide && <span className='block' data-import-tap-hint>{t('rep.xTapHint')}</span>}
                  </Callout>
                )}
                {wide ? (
                  <Table caption={t('rep.xPreviewCaption')}>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('rep.xColStatus')}</TableHead>
                        <TableHead>{t('rep.xColWho')}</TableHead>
                        <TableHead>{t('rep.colWork')}</TableHead>
                        <TableHead align='end' className={`w-[96px] whitespace-normal ${WORD}`}>
                          {t('rep.colHours')}
                        </TableHead>
                        <TableHead>{t('rep.xColFix')}</TableHead>
                        <TableHead>
                          <span className='sr-only'>{t('rep.xDrop')}</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((r) => (
                        <TableRow key={r.id} data-import-row={r.id} data-import-ok={r.errors.length === 0}>
                          <TableCell className='whitespace-nowrap py-x2_5'>{statusBadge(r)}</TableCell>
                          <TableCell className='whitespace-nowrap py-x2_5'>
                            <span className='block'>{r.date}</span>
                            {r.fixable.includes('manager') ? (
                              <div className='mt-x1'>
                                <PersonPick
                                  people={users.data}
                                  value={r.managerId}
                                  name={r.userName}
                                  invalid={r.errors.includes('xUserMissing')}
                                  disabled={usersBlocked}
                                  onPick={(id) => fix(r.id, { managerId: id })}
                                />
                              </div>
                            ) : (
                              <span className={`block text-t3 text-fg-neutral-subtle ${WORD}`}>{r.userName}</span>
                            )}
                          </TableCell>
                          {r.fixable.length > 0 && r.fixable.some((f) => f !== 'manager') ? (
                            <TableCell className='w-[202px] min-w-[120px] whitespace-normal py-x2_5'>
                              <div className='flex w-full flex-col gap-x1_5 [contain:inline-size]'>
                                {r.fixable.includes('group') ? (
                                  <div data-import-fix='group'>
                                    <Select size='medium' aria-label={fieldLabel(t('rep.fGroup'), r)} placeholder={t('rep.groupPlaceholder')} value={r.groupCode ?? ''} disabled={codesBlocked} aria-invalid={r.errors.includes('xGroupInvalid') || undefined} onValueChange={(v) => fix(r.id, { groupCode: v })}>
                                      {groups.map((g) => (
                                        <SelectItem key={g.work_code} value={g.work_code} label={g.work_code_name} />
                                      ))}
                                    </Select>
                                  </div>
                                ) : (
                                  <span className={`block ${WORD}`}>{r.groupName}</span>
                                )}
                                {r.fixable.includes('part') ? (
                                  <div data-import-fix='part'>
                                    <Select size='medium' aria-label={fieldLabel(t('rep.fPart'), r)} placeholder={t('rep.partPlaceholder')} value={r.partCode ?? ''} disabled={codesBlocked || !r.groupCode} aria-invalid={r.errors.includes('xPartInvalid') || undefined} onValueChange={(v) => fix(r.id, { partCode: v })}>
                                      {partsOf(groups, r.groupCode ?? '').map((p) => (
                                        <SelectItem key={p.work_code} value={p.work_code} label={p.work_code_name} />
                                      ))}
                                    </Select>
                                  </div>
                                ) : (
                                  <span className={`block ${WORD}`}>{r.partName}</span>
                                )}
                                {r.fixable.includes('division') ? (
                                  <div data-import-fix='division'>
                                    <Select size='medium' aria-label={fieldLabel(t('rep.fDivision'), r)} placeholder={t('rep.divisionPlaceholder')} value={r.divisionCode ?? ''} disabled={codesBlocked} aria-invalid={r.errors.includes('xDivisionInvalid') || undefined} onValueChange={(v) => fix(r.id, { divisionCode: v })}>
                                      {divisions.map((d) => (
                                        <SelectItem key={d.work_code} value={d.work_code} label={d.work_code_name} />
                                      ))}
                                    </Select>
                                  </div>
                                ) : (
                                  <span className={`block text-t3 text-fg-neutral-subtle ${WORD}`}>{r.divisionName}</span>
                                )}
                              </div>
                            </TableCell>
                          ) : (
                            <TableCell className={`min-w-[130px] whitespace-normal py-x2_5 ${WORD}`}>
                              <span className='block'>{[r.groupName, r.partName].filter(Boolean).join(' › ')}</span>
                              <span className='block text-t3 text-fg-neutral-subtle'>{r.divisionName}</span>
                            </TableCell>
                          )}
                          <TableCell align='end' className='whitespace-nowrap py-x2_5'>
                            {r.hours}
                          </TableCell>
                          <TableCell className={`min-w-[140px] whitespace-normal py-x2_5 text-fg-critical [overflow-wrap:anywhere] [word-break:keep-all]`}>{errorLines(r)}</TableCell>
                          <TableCell className='whitespace-nowrap py-x2_5'>{dropButton(r)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <List className='-mx-x6'>
                    {rows.map((r) => {
                      const props = {
                        'data-import-row': r.id,
                        'data-import-ok': r.errors.length === 0,
                        title: <span className={WORD}>{t('rep.xRowTitle', { date: r.date, name: r.userName })}</span>,
                        detail: (
                          <>
                            <span className={`block ${WORD}`}>{t('rep.xRowDetail', { path: [r.groupName, r.partName, r.divisionName].join(' › '), hours: r.hours || 0 })}</span>
                            {r.errors.length > 0 && <span className={`block text-fg-critical ${WORD}`}>{errorLines(r)}</span>}
                          </>
                        ),
                        align: 'top' as const,
                      }
                      // 오류 줄은 눌러 고친다(빼기는 고치기 시트 바닥) — 눌리는 줄 안에 버튼을 두지 않는다
                      return r.errors.length > 0 ? (
                        <ListButtonItem key={r.id} {...props} aria-haspopup='dialog' suffix={statusBadge(r)} onClick={() => setFixingId(r.id)} />
                      ) : (
                        <ListItem
                          key={r.id}
                          {...props}
                          suffix={
                            <span className='flex flex-col items-end gap-x1'>
                              {statusBadge(r)}
                              {dropButton(r)}
                            </span>
                          }
                        />
                      )
                    })}
                  </List>
                )}
              </>
            )}
          </div>
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          <ResponsiveDialogCancel>{tc('cancel')}</ResponsiveDialogCancel>
          {step === 'input' ? (
            <Button variant='neutralSolid' disabled={usersBlocked || codesBlocked} loading={!codes.ready && !codes.failed} onClick={verify} data-import-verify>
              {t('rep.xVerify')}
            </Button>
          ) : (
            <>
              <Button variant='neutralWeak' disabled={registering} onClick={() => setStep('input')} data-import-prev>
                {t('rep.xPrev')}
              </Button>
              <Button variant='neutralSolid' loading={registering} disabled={errorCount > 0 || rows.length === 0} onClick={() => void register()} data-import-register>
                {t('rep.xRegister', { count: rows.length })}
              </Button>
            </>
          )}
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
      {!wide && fixingRow && (
        <BottomSheet open onOpenChange={(o) => !o && setFixingId(null)}>
          <BottomSheetContent title={t('rep.xFixTitle')} description={t('rep.xRowTitle', { date: fixingRow.date, name: fixingRow.userName })}>
            <BottomSheetBody scrollFog>
              <div className='flex flex-col gap-x4 pb-x2' data-import-fix-sheet>
                {fixingRow.errors.length > 0 ? (
                  <Callout tone='critical' role='alert' data-import-fix-errors>
                    {errorLines(fixingRow)}
                  </Callout>
                ) : (
                  <Callout tone='positive' data-import-fix-ok>
                    {t('rep.xFixDone')}
                  </Callout>
                )}
                <div className='-mx-x6 flex flex-col' data-import-fix-rows>
                  {fixingRow.fixable.includes('manager') && (
                    <PickerRow title={t('rep.fManager')} surfaceTitle={t('rep.fManager')} value={fixingRow.errors.includes('xUserMissing') ? '' : fixingRow.userName} placeholder={t('rep.xPickPerson')} errorMessage={fixingRow.errors.includes('xUserMissing') ? t('rep.xUserMissing') : undefined} scrollFog onOpenAutoFocus={focusSearchableList}>
                      {({ close }) => (
                        <PersonList
                          people={users.data}
                          value={fixingRow.managerId}
                          onPick={(id) => {
                            fix(fixingRow.id, { managerId: id })
                            close()
                          }}
                        />
                      )}
                    </PickerRow>
                  )}
                  {fixingRow.fixable.includes('group') && <CodePick title={t('rep.fGroup')} placeholder={t('rep.groupPlaceholder')} value={fixingRow.groupCode ?? ''} options={groups} error={fixingRow.errors.includes('xGroupInvalid') ? t('rep.xGroupInvalid') : undefined} disabled={codesBlocked} onPick={(c) => fix(fixingRow.id, { groupCode: c })} />}
                  {fixingRow.fixable.includes('part') && <CodePick title={t('rep.fPart')} placeholder={fixingRow.groupCode ? t('rep.partPlaceholder') : t('rep.partNeedGroup')} value={fixingRow.partCode ?? ''} options={partsOf(groups, fixingRow.groupCode ?? '')} error={fixingRow.errors.includes('xPartInvalid') ? t('rep.xPartInvalid') : undefined} disabled={codesBlocked || !fixingRow.groupCode} onPick={(c) => fix(fixingRow.id, { partCode: c })} />}
                  {fixingRow.fixable.includes('division') && <CodePick title={t('rep.fDivision')} placeholder={t('rep.divisionPlaceholder')} value={fixingRow.divisionCode ?? ''} options={divisions} error={fixingRow.errors.includes('xDivisionInvalid') ? t('rep.xDivisionInvalid') : undefined} disabled={codesBlocked} onPick={(c) => fix(fixingRow.id, { divisionCode: c })} />}
                </div>
              </div>
            </BottomSheetBody>
            <BottomSheetFooter>
              <Button variant='ghost' ghostColor='critical' size='large' onClick={() => drop(fixingRow.id)} data-import-drop>
                {t('rep.xDrop')}
              </Button>
              <Button variant='neutralSolid' onClick={() => setFixingId(null)} data-import-fix-done>
                {tc('confirm')}
              </Button>
            </BottomSheetFooter>
          </BottomSheetContent>
        </BottomSheet>
      )}
    </ResponsiveDialog>
  )
}
