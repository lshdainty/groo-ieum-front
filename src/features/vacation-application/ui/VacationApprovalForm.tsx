import dayjs from 'dayjs';
import {
  Ban,
  Calendar,
  CheckCircle,
  FileText,
  User,
  Users,
  XCircle
} from 'lucide-react';
import { Activity, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { usePostApproveVacationMutation, usePostRejectVacationMutation } from '@/entities/vacation';
import type { GetUserRequestedVacationsResp } from '@/entities/vacation';
import { toast } from '@/shared/ui/shadcn/sonner';
import { Badge } from '@/shared/ui/shadcn/badge';
import { Button } from '@/shared/ui/shadcn/button';
import { Spinner } from '@/shared/ui/shadcn/spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/shadcn/dialog';
import { ScrollArea } from '@/shared/ui/shadcn/scrollArea'
import { Separator } from '@/shared/ui/shadcn/separator'
import { Textarea } from '@/shared/ui/shadcn/textarea'
import { useUser } from '@/entities/session'
import { getStatusBadge, getStatusConfig, getStatusIcon } from '@/shared/lib/vacationStatus'

interface VacationApprovalFormProps {
  open: boolean;
  onClose: () => void;
  requestData?: GetUserRequestedVacationsResp;
}

const VacationApprovalForm = ({
  open,
  onClose,
  requestData,
}: VacationApprovalFormProps) => {
  const { t } = useTranslation('vacation')
  const { t: tc } = useTranslation('common')
  const { loginUser } = useUser()
  const [showRejectReason, setShowRejectReason] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const { mutate: approveVacation, isPending: isApprovePending } = usePostApproveVacationMutation()
  const { mutate: rejectVacation, isPending: isRejectPending } = usePostRejectVacationMutation()

  const approvers = requestData?.approvers || []

  // 현재 로그인한 사용자가 현재 결재자인지 확인
  const isCurrentApprover = loginUser?.user_id === requestData?.current_approver_id

  // 현재 결재자의 approval_id 찾기
  const currentApprovalId = approvers.find(
    approver => approver.approver_id === requestData?.current_approver_id
  )?.approval_id

  // 반려 사유 찾기 (REJECTED 상태인 승인자의 반려 사유)
  const rejectionInfo = approvers.find(
    approver => approver.approval_status === 'REJECTED'
  )

  const handleApprove = () => {
    if (!currentApprovalId || !loginUser?.user_id) return

    approveVacation({
      approvalId: currentApprovalId,
      approverId: loginUser.user_id
    }, {
      onSuccess: () => {
        onClose()
      }
    })
  }

  const handleReject = () => {
    if (!currentApprovalId || !loginUser?.user_id) return
    if (!rejectReason.trim()) {
      toast.error(t('approval.rejectReasonRequired'))
      return
    }

    rejectVacation({
      approvalId: currentApprovalId,
      approverId: loginUser.user_id,
      rejectionReason: rejectReason
    }, {
      onSuccess: () => {
        setRejectReason('')
        setShowRejectReason(false)
        onClose()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='max-w-5xl max-h-[90vh] p-0 grid grid-rows-[auto_1fr_auto]'>
        <DialogHeader className='p-6 pb-4 border-b'>
          <DialogTitle className='text-2xl font-bold'>
            {t('approval.title')}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className='flex-1'>
          <div className='p-6'>
            <div className='space-y-6'>
              {/* 메인 폼 영역 */}
              <div className='grid grid-cols-1 min-[64rem]:grid-cols-3 gap-6'>
                {/* 좌측: 기본 정보 */}
                <div className='min-[64rem]:col-span-2 space-y-6'>
                  <Card>
                    <CardHeader>
                      <CardTitle className='flex items-center gap-2'>
                        <FileText className='w-5 h-5 text-blue-600' />
                        {t('approval.basicInfo')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      {/* 기안자 정보 */}
                      <div className='border rounded-lg overflow-hidden'>
                        <div className='bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-2 border-b'>
                          <div className='flex items-center gap-2'>
                            <User className='w-4 h-4 text-blue-600' />
                            <h3 className='text-sm font-semibold text-blue-900'>{t('approval.applicantInfo')}</h3>
                          </div>
                        </div>
                        <table className='w-full text-sm'>
                          <tbody>
                            <tr className='border-b'>
                              <td className='bg-muted px-4 py-3 font-medium w-32'>{t('approval.applicantLabel')}</td>
                              <td className='px-4 py-3'>
                                {requestData?.applicant_name || tc('noInfo')}
                              </td>
                            </tr>
                            <tr>
                              <td className='bg-muted px-4 py-3 font-medium'>{t('approval.requestDateLabel')}</td>
                              <td className='px-4 py-3'>
                                {requestData?.create_date
                                  ? dayjs(requestData.create_date).format('YYYY-MM-DD HH:mm')
                                  : tc('noInfo')}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <Separator />

                      {/* 휴가 정책 정보 */}
                      <div className='border rounded-lg overflow-hidden'>
                        <div className='bg-gradient-to-r from-purple-50 to-purple-100 px-4 py-2 border-b'>
                          <div className='flex items-center gap-2'>
                            <Calendar className='w-4 h-4 text-purple-600' />
                            <h3 className='text-sm font-semibold text-purple-900'>{t('approval.policyInfo')}</h3>
                          </div>
                        </div>
                        <table className='w-full text-sm'>
                          <tbody>
                            <tr className='border-b'>
                              <td className='bg-muted px-4 py-3 font-medium w-32'>{t('approval.policyName')}</td>
                              <td className='px-4 py-3 font-medium'>
                                {requestData?.policy_name || tc('noInfo')}
                              </td>
                            </tr>
                            <tr className='border-b'>
                              <td className='bg-muted px-4 py-3 font-medium'>{t('approval.vacationType')}</td>
                              <td className='px-4 py-3'>
                                <Badge variant='outline' className='bg-blue-50 text-blue-700'>
                                  {requestData?.vacation_type_name || tc('noInfo')}
                                </Badge>
                              </td>
                            </tr>
                            <tr className='border-b'>
                              <td className='bg-muted px-4 py-3 font-medium'>{t('approval.grantStandardTime')}</td>
                              <td className='px-4 py-3'>
                                <div className='flex items-center gap-2'>
                                  <Badge variant='outline' className='bg-green-50 text-green-700'>
                                    {requestData?.policy_grant_time_str || tc('noInfo')}
                                  </Badge>
                                </div>
                              </td>
                            </tr>
                            {requestData?.grant_date && (
                              <tr className='border-b'>
                                <td className='bg-muted px-4 py-3 font-medium'>{t('approval.grantDate')}</td>
                                <td className='px-4 py-3 text-foreground'>
                                  {dayjs(requestData.grant_date).format('YYYY-MM-DD')}
                                </td>
                              </tr>
                            )}
                            {requestData?.expiry_date && (
                              <tr>
                                <td className='bg-muted px-4 py-3 font-medium'>{t('approval.expiryDate')}</td>
                                <td className='px-4 py-3'>
                                  <span className='text-red-600 font-medium'>
                                    {dayjs(requestData.expiry_date).format('YYYY-MM-DD')}
                                  </span>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      <Separator />

                      {/* 신청 상세 정보 */}
                      <div className='border rounded-lg overflow-hidden'>
                        <div className='bg-gradient-to-r from-green-50 to-green-100 px-4 py-2 border-b'>
                          <div className='flex items-center gap-2'>
                            <FileText className='w-4 h-4 text-green-600' />
                            <h3 className='text-sm font-semibold text-green-900'>{t('approval.requestDetail')}</h3>
                          </div>
                        </div>
                        <table className='w-full text-sm'>
                          <tbody>
                            <tr className='border-b'>
                              <td className='bg-muted px-4 py-3 font-medium w-32'>{t('approval.titleLabel')}</td>
                              <td className='px-4 py-3 font-medium'>
                                {requestData?.desc || tc('noInfo')}
                              </td>
                            </tr>
                            <tr className='border-b'>
                              <td className='bg-muted px-4 py-3 font-medium'>{t('approval.targetDate')}</td>
                              <td className='px-4 py-3'>
                                {requestData?.request_start_time && requestData?.request_end_time ? (
                                  <div className='space-y-1'>
                                    <div className='font-medium'>
                                      {dayjs(requestData.request_start_time).format('YYYY-MM-DD HH:mm')}
                                      {' ~ '}
                                      {dayjs(requestData.request_end_time).format('YYYY-MM-DD HH:mm')}
                                    </div>
                                    <div className='flex items-center gap-2 mt-2'>
                                      <Badge className='bg-blue-100 text-blue-800 border-blue-300 border'>
                                        {t('approval.totalTime', { time: requestData.grant_time_str })}
                                      </Badge>
                                    </div>
                                  </div>
                                ) : requestData?.request_start_time ? (
                                  <div className='space-y-1'>
                                    <div className='font-medium'>
                                      {dayjs(requestData.request_start_time).format('YYYY-MM-DD HH:mm')}
                                    </div>
                                    <Badge className='bg-blue-100 text-blue-800 border-blue-300 border mt-2'>
                                      {t('approval.totalTime', { time: requestData.grant_time_str })}
                                    </Badge>
                                  </div>
                                ) : (
                                  tc('noInfo')
                                )}
                              </td>
                            </tr>
                            <tr className='border-b'>
                              <td className='bg-muted px-4 py-3 font-medium'>{t('approval.currentStatus')}</td>
                              <td className='px-4 py-3'>
                                <div className='flex items-center gap-2'>
                                  {(() => {
                                    const statusConfig = getStatusConfig(requestData?.grant_status || '');
                                    const StatusIcon = statusConfig?.icon;
                                    return (
                                      <Badge variant='outline' className={`${statusConfig?.color || ''} border`}>
                                        {StatusIcon && <StatusIcon className='w-3 h-3 mr-1' />}
                                        {requestData?.grant_status_name || tc('noInfo')}
                                      </Badge>
                                    );
                                  })()}
                                  {requestData?.current_approver_name && (
                                    <span className='text-xs text-foreground/70'>
                                      {t('approval.currentApprover')}: <span className='font-medium'>{requestData.current_approver_name}</span>
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                            <tr className={rejectionInfo?.rejection_reason ? 'border-b' : ''}>
                              <td className='bg-muted px-4 py-3 font-medium align-top'>{t('approval.requestReason')}</td>
                              <td className='px-4 py-3'>
                                <div className='whitespace-pre-wrap text-foreground'>
                                  {requestData?.request_desc || '-'}
                                </div>
                              </td>
                            </tr>
                            {rejectionInfo?.rejection_reason && (
                              <tr>
                                <td className='bg-muted px-4 py-3 font-medium align-top'>{t('approval.rejectionReason')}</td>
                                <td className='px-4 py-3'>
                                  <div className='whitespace-pre-wrap text-red-600 font-medium'>
                                    {rejectionInfo.rejection_reason}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 우측: 결재선 */}
                <div className='min-[64rem]:col-span-1'>
                  <Card className='sticky top-0'>
                    <CardHeader>
                      <CardTitle className='flex items-center gap-2'>
                        <Users className='w-5 h-5 text-purple-600' />
                        {t('approval.approvalLine')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {requestData?.grant_status === 'CANCELED' ? (
                        <div className='border rounded-lg overflow-hidden p-8'>
                          <div className='flex flex-col items-center gap-4'>
                            <div className='w-16 h-16 rounded-lg bg-muted flex items-center justify-center'>
                              <Ban className='w-10 h-10 text-foreground' />
                            </div>
                            <div className='text-center'>
                              <p className='text-lg font-semibold text-foreground mb-1'>{t('approval.canceled')}</p>
                              <p className='text-sm text-foreground/70'>{t('approval.canceledDesc')}</p>
                            </div>
                          </div>
                        </div>
                      ) : approvers.length > 0 ? (
                        <div className='border rounded-lg overflow-hidden'>
                          <table className='w-full table-fixed'>
                            <thead>
                              <tr>
                                {approvers.map((approver, index) => (
                                  <th
                                    key={`header-${approver.approval_id}`}
                                    className='bg-muted px-2 py-2 text-xs font-medium border-r last:border-r-0'
                                  >
                                    {approvers.length > 1 ? t('approval.nthApproval', { index: index + 1 }) : t('approval.approveBtn')}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                {approvers.map((approver) => (
                                  <td
                                    key={approver.approval_id}
                                    className='border-r last:border-r-0 p-3'
                                  >
                                    <div className='flex flex-col items-center gap-2 min-h-[100px] justify-center'>
                                      {approver.approval_status === 'APPROVED' || approver.approval_status === 'REJECTED' ? (
                                        <>
                                          {getStatusIcon(approver.approval_status)}
                                          {approver.approval_date && (
                                            <p className='text-xs text-foreground/70'>
                                              {dayjs(approver.approval_date).format('YYYY/MM/DD')}
                                            </p>
                                          )}
                                        </>
                                      ) : (
                                        <div className='h-8 w-8' />
                                      )}
                                      <p className='text-xs font-medium mt-1 text-center break-all'>
                                        {approver.approver_name}
                                      </p>
                                      {getStatusBadge(approver.approval_status, approver.approval_status_name)}
                                    </div>
                                  </td>
                                ))}
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className='text-sm text-foreground/70 text-center py-4'>{t('approval.noApprovers')}</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* 결재 처리 카드 */}
                  <Activity mode={isCurrentApprover && (requestData?.grant_status === 'PROGRESS' || requestData?.grant_status === 'PENDING') ? 'visible' : 'hidden'}>
                    <Card className='mt-6'>
                      <CardHeader>
                        <CardTitle className='flex items-center gap-2'>
                          <CheckCircle className='w-5 h-5 text-green-600' />
                          {t('approval.approvalProcess')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='space-y-4'>
                        {showRejectReason ? (
                          <div className='space-y-4'>
                            <div>
                              <label className='text-sm font-medium mb-2 block'>
                                {t('approval.rejectReasonLabel')} <span className='text-red-500'>*</span>
                              </label>
                              <Textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder={t('approval.rejectReasonPlaceholder')}
                                rows={4}
                                className='resize-none'
                              />
                            </div>
                            <div className='flex gap-2'>
                              <Button
                                variant='outline'
                                onClick={() => {
                                  setShowRejectReason(false)
                                  setRejectReason('')
                                }}
                                className='flex-1'
                              >
                                {tc('cancel')}
                              </Button>
                              <Button
                                variant='destructive'
                                onClick={handleReject}
                                className='flex-1'
                                disabled={isRejectPending}
                              >
                                {isRejectPending ? <Spinner /> : <XCircle className='w-4 h-4 mr-2' />}
                                {t('approval.confirmReject')}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className='flex gap-2'>
                            <Button
                              onClick={() => setShowRejectReason(true)}
                              className='flex-1 bg-red-600 hover:bg-red-700 text-white'
                              disabled={isApprovePending}
                            >
                              <XCircle className='w-4 h-4 mr-2' />
                              {t('approval.rejectBtn')}
                            </Button>
                            <Button
                              onClick={handleApprove}
                              className='flex-1 bg-green-600 hover:bg-green-700 text-white'
                              disabled={isApprovePending}
                            >
                              {isApprovePending ? <Spinner /> : <CheckCircle className='w-4 h-4 mr-2' />}
                              {t('approval.approveBtn')}
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Activity>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* 하단 버튼 */}
        <div className='p-6 pt-4 border-t bg-muted/50'>
          <div className='flex justify-end gap-3'>
            <Button variant='outline' onClick={onClose} type='button'>
              {tc('close')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { VacationApprovalForm }
