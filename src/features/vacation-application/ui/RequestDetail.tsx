import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ds/button'
import { Callout } from '@/shared/ds/callout'
import { ResponsiveDialog, ResponsiveDialogBody, ResponsiveDialogCancel, ResponsiveDialogContent, ResponsiveDialogFooter } from '@/shared/ds/dialog'
import { Field } from '@/shared/ds/field'
import { List, ListHeader, ListItem } from '@/shared/ds/list'
import { useSnackbar } from '@/shared/ds/snackbar'
import { Textarea } from '@/shared/ds/textarea'
import { cn } from '@/shared/lib/cn'
import { formatClock, formatDayText } from '@/shared/lib/date-text'
import { VacationStatusBadge } from '@/shared/ui/groo/vacation-status'
import { readWriteFailure } from '@/shared/ui/groo/write-error'
import { useUser } from '@/entities/session'
import { usePostApproveVacationMutation, usePostRejectVacationMutation, type ApproverInfo, type GetUserRequestedVacationsResp } from '@/entities/vacation'
import { canCancelRequest, requestTargetText, requestTitle } from '../lib/request-format'
import { CancelRequestConfirm } from './CancelRequestConfirm'

type StepState = 'done' | 'turn' | 'waiting' | 'rejected' | 'skipped'

const stepStateOf = (a: ApproverInfo, r: GetUserRequestedVacationsResp): StepState => {
  if (a.approval_status === 'APPROVED') return 'done'
  if (a.approval_status === 'REJECTED') return 'rejected'
  const open = r.grant_status === 'PENDING' || r.grant_status === 'PROGRESS'
  if (!open) return 'skipped'
  return a.approver_id === r.current_approver_id ? 'turn' : 'waiting'
}

/** 단계 표시 24 — 끝남 positive-weak ✓ · 지금 차례 inverted + 숫자 · 기다림 테두리 + 숫자 · 반려 critical-weak ✕ */
const MARK: Record<StepState, string> = {
  done: 'bg-bg-positive-weak text-fg-positive-contrast',
  turn: 'bg-bg-neutral-inverted text-fg-neutral-inverted',
  waiting: 'text-fg-neutral-subtle shadow-[inset_0_0_0_1px_var(--color-stroke-neutral-solid)]',
  rejected: 'bg-bg-critical-weak text-fg-critical-contrast',
  skipped: 'text-fg-neutral-subtle shadow-[inset_0_0_0_1px_var(--color-stroke-neutral-solid)]',
}

const dayClock = (value: string): string => `${formatDayText(value)} ${formatClock(value)}`

const ApprovalSteps = ({ request }: { request: GetUserRequestedVacationsResp }) => {
  const { t } = useTranslation('vacation')
  const list = [...(request.approvers ?? [])].sort((a, b) => a.approval_order - b.approval_order)
  if (list.length === 0) {
    return <p className='m-0 px-global-gutter py-x3 text-t4 text-fg-neutral-muted [word-break:keep-all]'>{t('req.detailNoApproval')}</p>
  }
  return (
    <ol className='m-0 list-none p-0' data-approval-steps>
      {list.map((a, i) => {
        const state = stepStateOf(a, request)
        const at = a.approval_date ? dayClock(a.approval_date) : null
        const detail =
          state === 'done'
            ? at ? t('req.stepApproved', { at }) : t('req.stepApprovedNoDate')
            : state === 'rejected'
              ? at ? t('req.stepRejected', { at }) : t('req.stepRejectedNoDate')
              : state === 'turn'
                ? t('req.stepTurn')
                : state === 'waiting'
                  ? t('req.stepWaiting')
                  : t('req.stepSkipped')
        return (
          <li key={a.approval_id} data-step={a.approval_order} data-step-state={state} className='flex gap-x3 px-global-gutter py-x3'>
            <span className='flex flex-col items-center self-stretch'>
              <span aria-hidden className={cn('flex size-6 shrink-0 items-center justify-center rounded-full text-t2 font-bold tabular-nums', MARK[state])}>
                {state === 'done' ? <Check className='size-4' /> : state === 'rejected' ? <X className='size-4' /> : a.approval_order}
              </span>
              {i < list.length - 1 && <span aria-hidden className='-mb-x3 mt-x1 w-[2px] flex-1 bg-stroke-neutral-subtle' />}
            </span>
            <span className='flex min-w-0 flex-1 flex-col'>
              <span className='text-t5 font-medium text-fg-neutral [overflow-wrap:break-word] [word-break:keep-all]'>
                {t('req.stepName', { k: a.approval_order, name: a.approver_name })}
              </span>
              <span className='text-t3 text-fg-neutral-subtle'>{detail}</span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}

/**
 * 신청 상세(I-25 F 28 ~ 30) — 1280 이상 대화상자 · 미만 Bottom Sheet(조회형), 결재 진행이 맨 위.
 * 바닥은 보는 사람에 따라 하나: 내 대기 신청 = [신청 취소](`cancelUserId` 를 준 화면만) · 내가 지금 결재자 = [반려][승인](반려는 같은 표면 한 단계) · 그 밖 없음.
 * 신청 취소는 확인창(상세 위)이 묻고 끝나면 상세도 닫는다.
 */
export function RequestDetail({
  open,
  onClose,
  requestData,
  cancelUserId,
  latest,
}: {
  open: boolean
  onClose: () => void
  requestData?: GetUserRequestedVacationsResp
  /** 이 사람이 취소할 수 있는 화면(내 신청 목록)이면 로그인한 사람의 id — 없으면 취소 단추가 없다 */
  cancelUserId?: string
  latest?: (id: number) => GetUserRequestedVacationsResp | undefined
}) {
  const { t } = useTranslation('vacation')
  const { t: tc } = useTranslation('common')
  const { loginUser } = useUser()
  const snackbar = useSnackbar()
  const approve = usePostApproveVacationMutation()
  const reject = usePostRejectVacationMutation()
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [showError, setShowError] = useState(false)
  const [busy, setBusy] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [cancelTarget, setCancelTarget] = useState<GetUserRequestedVacationsResp | null>(null)

  const r = requestData
  const list = r?.approvers ?? []
  const myTurn = !!r && !!loginUser?.user_id && r.current_approver_id === loginUser.user_id && (r.grant_status === 'PENDING' || r.grant_status === 'PROGRESS')
  const approvalId = list.find((a) => a.approver_id === r?.current_approver_id)?.approval_id
  const rejection = list.find((a) => a.approval_status === 'REJECTED')
  const mine = !!r && !!cancelUserId && canCancelRequest(r)

  const reset = () => {
    setRejecting(false)
    setReason('')
    setShowError(false)
    setSaveError(null)
  }
  const close = () => {
    reset()
    onClose()
  }

  const run = async (action: () => Promise<unknown>, done: string) => {
    if (busy) return
    setBusy(true)
    setSaveError(null)
    try {
      await action()
      close()
      snackbar.show({ message: done, tone: 'positive' })
    } catch (error) {
      readWriteFailure(error)
      setSaveError(t('req.actionFailed'))
    } finally {
      setBusy(false)
    }
  }

  const submitApprove = () => {
    if (!approvalId || !loginUser?.user_id) return
    void run(() => approve.mutateAsync({ approvalId, approverId: loginUser.user_id }), t('req.approved'))
  }
  const submitReject = () => {
    if (!approvalId || !loginUser?.user_id) return
    if (!reason.trim()) {
      setShowError(true)
      return
    }
    void run(() => reject.mutateAsync({ approvalId, approverId: loginUser.user_id, rejectionReason: reason.trim() }), t('req.rejected'))
  }

  const requestedAt = r?.create_date ? dayClock(r.create_date) : ''
  const kv = (label: string, value: string, name: string) => (
    <ListItem key={name} data-kv={name} title={label} suffix={<span className='[overflow-wrap:break-word] [word-break:keep-all]'>{value}</span>} suffixText align='top' />
  )

  return (
    <>
      <ResponsiveDialog
        open={open}
        form={rejecting}
        dirty={rejecting && reason.trim() !== ''}
        busy={busy}
        onOpenChange={(next) => {
          if (!next) close()
        }}
      >
        <ResponsiveDialogContent
          title={rejecting ? t('req.rejectTitle') : r ? requestTitle(r) : ''}
          description={
            rejecting || !r ? undefined : (
              <span className='inline-flex flex-wrap items-center gap-x2'>
                <VacationStatusBadge status={r.grant_status} />
                <span>{r.vacation_type_name}</span>
              </span>
            )
          }
          onBack={rejecting ? () => { setRejecting(false); setSaveError(null) } : undefined}
        >
          <ResponsiveDialogBody>
            {saveError && (
              <Callout tone='critical' role='alert' className='mb-x4' data-save-failure>
                {saveError}
              </Callout>
            )}
            {rejecting ? (
              <Field label={t('req.rejectTitle')} showRequiredIndicator invalid={showError && !reason.trim()} errorMessage={t('req.rejectRequired')}>
                <Textarea value={reason} placeholder={t('req.rejectPlaceholder')} onChange={(e) => setReason(e.target.value)} data-reject-reason />
              </Field>
            ) : (
              r && (
                <div className='flex flex-col gap-x2' data-request-detail>
                  {r.grant_status === 'REJECTED' && (
                    <Callout tone='critical' data-reject-callout>
                      <strong className='font-bold'>{t('req.detailRejectReason')}</strong>
                      <span className='block whitespace-pre-wrap [overflow-wrap:break-word]'>{rejection?.rejection_reason || '—'}</span>
                    </Callout>
                  )}
                  <ListHeader as='h3'>{t('req.detailProgress')}</ListHeader>
                  <ApprovalSteps request={r} />
                  <ListHeader as='h3'>{t('req.detailContent')}</ListHeader>
                  <List>
                    {cancelUserId === undefined && r.applicant_name ? kv(t('req.detailApplicant'), r.applicant_name, 'applicant') : null}
                    {kv(t('req.detailPolicy'), r.policy_name, 'policy')}
                    {kv(t('req.detailDate'), requestTargetText(r), 'date')}
                    {kv(t('req.detailGrant'), r.grant_time_str, 'grant')}
                    {kv(t('req.detailRequestedAt'), requestedAt, 'requested')}
                    {r.request_desc?.trim() ? (
                      <ListItem data-kv='reason' title={t('req.detailReason')} detail={<span className='whitespace-pre-wrap [overflow-wrap:break-word]'>{r.request_desc}</span>} />
                    ) : null}
                  </List>
                </div>
              )
            )}
          </ResponsiveDialogBody>
          {rejecting ? (
            <ResponsiveDialogFooter>
              <Button variant='criticalSolid' loading={busy} onClick={submitReject} data-reject-submit>
                {t('req.rejectConfirm')}
              </Button>
            </ResponsiveDialogFooter>
          ) : myTurn ? (
            <ResponsiveDialogFooter>
              <Button variant='neutralWeak' disabled={busy} onClick={() => setRejecting(true)} data-reject>
                {t('req.reject')}
              </Button>
              <Button loading={busy} onClick={submitApprove} data-approve>
                {t('req.approve')}
              </Button>
            </ResponsiveDialogFooter>
          ) : mine && r ? (
            <ResponsiveDialogFooter>
              <Button variant='ghost' ghostColor='critical' disabled={busy} onClick={() => setCancelTarget(r)} data-cancel-request>
                {t('req.cancel')}
              </Button>
              <ResponsiveDialogCancel>{tc('close')}</ResponsiveDialogCancel>
            </ResponsiveDialogFooter>
          ) : null}
        </ResponsiveDialogContent>
      </ResponsiveDialog>
      <CancelRequestConfirm
        target={cancelTarget}
        latest={latest}
        userId={cancelUserId ?? ''}
        onOpenChange={(o) => {
          if (!o) setCancelTarget(null)
        }}
        onDone={close}
      />
    </>
  )
}

