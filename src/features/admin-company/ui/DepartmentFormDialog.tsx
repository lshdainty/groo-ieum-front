import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { claimFailure, writeFailureKey } from '@/shared/api/failure'
import { Button } from '@/shared/ds/button'
import { Callout } from '@/shared/ds/callout'
import { firstUnusedColor, type ChartColor } from '@/shared/ds/color-swatch'
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
import { usePostDepartmentMutation, usePutDepartmentMutation, type PostDepartmentReq } from '@/entities/department'
import { useUsersQuery } from '@/entities/user'
import { deptColorName, findDept, outsidePaletteHex, selfAndDescendantIds, usedColors, type Dept } from '../lib/dept-tree'
import { ColorRow, LeaderRow, ParentRow } from './DepartmentFormFields'

const NAME_MAX = 20
const DESC_MAX = 1000

/** 폼이 하는 일 — 새 부서(상위 없음: 빈 회사의 첫 부서) · 하위 부서 추가(상위 = 고른 부서) · 수정 */
export type DepartmentFormTarget =
  | { kind: 'add'; parent: Dept | null }
  | { kind: 'edit'; dept: Dept }

interface Values {
  nameKr: string
  nameEn: string
  parentId: number | null
  headId: string
  /** 사용자가 고른 색 — null 이면 저장 값을 그대로 둔다(옛 값을 몰래 바꾸지 않는다) */
  pickedColor: ChartColor | null
  desc: string
}

const initialOf = (target: DepartmentFormTarget, departments: Dept[]): Values => {
  if (target.kind === 'edit') {
    const d = target.dept
    return {
      nameKr: d.department_name_kr ?? '',
      nameEn: d.department_name ?? '',
      parentId: d.parent_id ?? null,
      headId: d.head_user_id ?? '',
      pickedColor: null,
      desc: d.department_desc ?? '',
    }
  }
  return {
    nameKr: '',
    nameEn: '',
    parentId: target.parent?.department_id ?? null,
    headId: '',
    // 새 부서의 처음 색 = 이 회사 부서가 아직 쓰지 않은 첫 색
    pickedColor: firstUnusedColor(usedColors(departments)),
    desc: '',
  }
}

/**
 * 부서 추가 · 하위 부서 추가 · 부서 수정(D 20) — ds Responsive Dialog `form`, 한 열. 칸 차례: 한글 이름 · 영문 이름 · 상위 부서(줄) · 부서장(줄) · 색(줄) · 설명.
 * 저장 본문은 지금 Post/PutDepartmentReq 그대로 — `parent_id` = 고른 상위, `tree_level` = 고른 상위 + 1(상위를 바꾸지 않았으면 지금 값).
 * 옮긴 부서 아래 부서들의 단계는 서버가 다시 센다(24-0). 색은 이름(`blue`)으로 저장하되, 고르지 않으면 저장 값을 그대로 보낸다.
 */
export function DepartmentFormDialog({
  open,
  onOpenChange,
  target,
  departments,
  companyId,
  onSaved,
  onCloseAutoFocus,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  target: DepartmentFormTarget
  departments: Dept[]
  companyId: string
  /** 저장 끝 — 새 부서면 그 id */
  onSaved?: (id: number | null) => void
  onCloseAutoFocus?: (e: Event) => void
}) {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const snackbar = useSnackbar()
  const initial = useMemo(() => initialOf(target, departments), [target, departments])
  const [values, setValues] = useState<Values>(initial)
  const [showErrors, setShowErrors] = useState(false)
  const [busy, setBusy] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const nameKrRef = useRef<HTMLInputElement>(null)
  const nameEnRef = useRef<HTMLInputElement>(null)
  const users = useUsersQuery({ quiet: true })
  const post = usePostDepartmentMutation()
  const put = usePutDepartmentMutation()

  const editing = target.kind === 'edit'
  const editDept = editing ? target.dept : null
  const storedCode = editDept?.color_code ?? null
  const storedName = deptColorName(storedCode)
  const storedHex = outsidePaletteHex(storedCode)
  const colorShown: ChartColor | 'current' | null = values.pickedColor ?? (storedName ?? (storedHex ? 'current' : null))
  const blocked = useMemo(() => (editDept ? selfAndDescendantIds(editDept) : new Set<number>()), [editDept])
  const isTop = editing && editDept?.parent_id == null

  const set = <K extends keyof Values>(key: K, value: Values[K]) => setValues((v) => ({ ...v, [key]: value }))
  const errors = {
    nameKr: values.nameKr.trim() === '',
    nameEn: values.nameEn.trim() === '',
    color: colorShown === null,
  }
  const dirty =
    values.nameKr !== initial.nameKr ||
    values.nameEn !== initial.nameEn ||
    values.parentId !== initial.parentId ||
    values.headId !== initial.headId ||
    values.pickedColor !== initial.pickedColor ||
    values.desc !== initial.desc

  const submit = async () => {
    if (busy) return
    if (errors.nameKr || errors.nameEn || errors.color) {
      setShowErrors(true)
      if (errors.nameKr) nameKrRef.current?.focus()
      else if (errors.nameEn) nameEnRef.current?.focus()
      return
    }
    const parent = values.parentId == null ? null : findDept(departments, values.parentId)
    const treeLevel = editDept && values.parentId === (editDept.parent_id ?? null) ? editDept.tree_level : parent ? parent.tree_level + 1 : 0
    // 고르지 않았으면 저장 값 그대로(옛 `chart-3` · 팔레트 밖 hex) — 고른 색만 새 이름으로
    const colorCode = values.pickedColor ?? storedCode ?? ''
    setBusy(true)
    setSaveError(null)
    try {
      const body: PostDepartmentReq = {
        department_name: values.nameEn.trim(),
        department_name_kr: values.nameKr.trim(),
        parent_id: values.parentId,
        head_user_id: values.headId || undefined,
        color_code: colorCode,
        tree_level: treeLevel,
        department_desc: values.desc,
        company_id: companyId,
      }
      if (editDept) {
        await put.mutateAsync({ departmentId: editDept.department_id, data: body })
        snackbar.show({ message: t('department.savedEdit', { name: body.department_name_kr }), tone: 'positive' })
        onSaved?.(editDept.department_id)
      } else {
        const created = await post.mutateAsync(body)
        snackbar.show({ message: t('department.savedAdd', { name: body.department_name_kr }), tone: 'positive' })
        onSaved?.(created.department_id)
      }
      onOpenChange(false)
    } catch (error) {
      claimFailure(error)
      const key = writeFailureKey(error)
      if (key) setSaveError(key === 'failure.write' ? t('department.saveFailed') : tc(key))
    } finally {
      setBusy(false)
    }
  }

  const title = editing ? t('department.editTitle') : target.parent ? t('department.addSubTitle') : t('department.addTitle')

  return (
    <ResponsiveDialog open={open} form dirty={dirty} busy={busy} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent
        title={title}
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          nameKrRef.current?.focus({ preventScroll: true })
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
            <Field label={t('department.nameKo')} showRequiredIndicator invalid={showErrors && errors.nameKr} errorMessage={t('department.nameKoRequired')} maxGraphemeCount={NAME_MAX}>
              <Input ref={nameKrRef} value={values.nameKr} onChange={(e) => set('nameKr', e.target.value.slice(0, NAME_MAX))} maxLength={NAME_MAX} />
            </Field>
            <Field label={t('department.nameEn')} showRequiredIndicator invalid={showErrors && errors.nameEn} errorMessage={t('department.nameEnRequired')} maxGraphemeCount={NAME_MAX}>
              <Input ref={nameEnRef} value={values.nameEn} onChange={(e) => set('nameEn', e.target.value.slice(0, NAME_MAX))} maxLength={NAME_MAX} />
            </Field>
            {/* 고르는 줄 칸 셋 — 줄이 제 좌우 24 를 가져 폼 안쪽 여백만큼 -mx 로 가장자리까지 */}
            <div className='-mx-x6 flex flex-col gap-x6'>
              <ParentRow
                departments={departments}
                value={values.parentId}
                onChange={(id) => set('parentId', id)}
                blocked={blocked}
                selfName={editDept?.department_name_kr}
                readOnlyTop={isTop}
              />
              <LeaderRow people={users.data ?? []} value={values.headId} onChange={(id) => set('headId', id)} />
              <ColorRow
                value={colorShown}
                currentHex={storedHex}
                onChange={(c) => set('pickedColor', c)}
                errorMessage={showErrors && errors.color ? t('department.colorRequired') : null}
              />
            </div>
            <Field label={t('department.description')} maxGraphemeCount={DESC_MAX}>
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
