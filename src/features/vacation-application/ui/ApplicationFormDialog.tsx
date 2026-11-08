import { Avatar, AvatarFallback } from '@/shared/ui/shadcn/avatar'
import { Button } from '@/shared/ui/shadcn/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/shared/ui/shadcn/dialog'
import { Field, FieldError, FieldLabel } from '@/shared/ui/shadcn/field'
import { Input } from '@/shared/ui/shadcn/input'
import { InputDatePicker } from '@/shared/ui/shadcn/inputDatePicker'
import { InputTimePicker } from '@/shared/ui/shadcn/inputTimePicker'
import { ScrollArea } from '@/shared/ui/shadcn/scrollArea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/ui/shadcn/select'
import { Separator } from '@/shared/ui/shadcn/separator'
import { Textarea } from '@/shared/ui/shadcn/textarea'
import { useUser } from '@/entities/session'
import { usePostRequestVacationMutation } from '@/entities/vacation'
import type { GetUserApproversResp } from '@/entities/user'
import type { GetUserVacationPoliciesResp } from '@/entities/vacation-policy'
import { zodResolver } from '@hookform/resolvers/zod'
import dayjs from 'dayjs'
import { AlertCircle, Calendar, Clock, Users } from 'lucide-react'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

const createFormSchema = (t: (key: string) => string) => z.object({
  vacationPolicyId: z.number().min(1, t('application.policyRequired')),
  title: z.string().min(1, t('application.titleRequired')),
  overtimeDate: z.string().min(1, t('application.dateRequired')),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  grantTime: z.number().optional(),
  reason: z.string().min(1, t('application.reasonRequired')),
  approvers: z.array(z.string()),
})

type OvertimeFormValues = z.infer<ReturnType<typeof createFormSchema>>

interface ApplicationFormDialogProps {
  open: boolean
  onClose: () => void
  onSubmitSuccess: () => void
  vacationPolicies: GetUserVacationPoliciesResp[]
  approversData: GetUserApproversResp
}

const ApplicationFormDialog = ({ open, onClose, onSubmitSuccess, vacationPolicies, approversData }: ApplicationFormDialogProps) => {
  const { t } = useTranslation('vacation')
  const { t: tc } = useTranslation('common')
  const { loginUser } = useUser()
  const { mutate: requestVacation } = usePostRequestVacationMutation()

  const formSchema = createFormSchema(t)

  // 승인자 데이터 추출
  const approvers = approversData?.approvers || []
  const maxAvailableCount = approversData?.max_available_count || 0
  const isAutoApproval = approversData?.is_auto_approval || false

  const form = useForm<OvertimeFormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      vacationPolicyId: 0,
      title: '',
      overtimeDate: '',
      startTime: '',
      endTime: '',
      grantTime: undefined,
      reason: '',
      approvers: []
    }
  })

  const vacationPolicyId = form.watch('vacationPolicyId')
  const startTime = form.watch('startTime')
  const endTime = form.watch('endTime')
  const selectedApprovers = form.watch('approvers')

  // 선택된 정책 찾기
  const selectedPolicy = vacationPolicies.find(
    policy => policy.vacation_policy_id === vacationPolicyId
  )

  // overtime 타입인지 확인 (대소문자 무관하게 체크)
  const isOvertimeType = selectedPolicy?.vacation_type?.toLowerCase() === 'overtime'

  // 실제 필요한 승인자 수 계산: min(정책 요구 인원, 가용 승인자 수)
  const policyRequiredCount = selectedPolicy?.approval_required_count || 0
  const actualRequiredCount = Math.min(policyRequiredCount, maxAvailableCount)

  // 승인자 선택 완료 여부 확인
  // 자동 승인이거나 실제 필요 인원이 0이면 승인자 선택 불필요
  const isApproversValid = isAutoApproval || actualRequiredCount === 0 ||
    (selectedApprovers && selectedApprovers.filter(a => a).length === actualRequiredCount)

  // 정책 변경 시 날짜와 시간 필드 초기화
  useEffect(() => {
    if (vacationPolicyId) {
      form.setValue('overtimeDate', '')
      form.setValue('startTime', '')
      form.setValue('endTime', '')
      form.setValue('grantTime', undefined)
      form.setValue('approvers', [])
    }
  }, [vacationPolicyId, form])

  const calculateHours = (start: string, end: string): number => {
    if (start && end) {
      const startDate = dayjs(`2025-01-01 ${start}`)
      const endDate = dayjs(`2025-01-01 ${end}`)
      // 분은 버리고 시간만 반환 (Math.floor 사용)
      const hours = endDate.diff(startDate, 'hour')
      return hours > 0 ? hours : 0
    }
    return 0
  }

  const overtimeHours = calculateHours(startTime || '', endTime || '')

  useEffect(() => {
    if (open) {
      form.reset({
        vacationPolicyId: 0,
        title: '',
        overtimeDate: '',
        startTime: '',
        endTime: '',
        grantTime: undefined,
        reason: '',
        approvers: []
      })
    }
  }, [open, form])

  const onSubmit = (values: OvertimeFormValues) => {
    if (!loginUser?.user_id) {
      console.error('User not logged in')
      return
    }

    // 날짜와 시간을 LocalDateTime 형식으로 변환
    // overtime 타입인 경우: 시작시간과 종료시간 포함
    // 일반 휴가인 경우: 해당 날짜의 00:00:00, 종료시간은 null
    const requestStartTime = isOvertimeType && values.startTime
      ? `${values.overtimeDate}T${values.startTime}:00`
      : `${values.overtimeDate}T00:00:00`
    const requestEndTime = isOvertimeType && values.endTime
      ? `${values.overtimeDate}T${values.endTime}:00`
      : null

    // API 요청 데이터 생성
    const baseRequestData = {
      user_id: loginUser.user_id,
      policy_id: values.vacationPolicyId,
      desc: values.title,
      approver_ids: values.approvers.filter(a => a),
      request_start_time: requestStartTime,
      request_end_time: requestEndTime,
      request_desc: values.reason
    }

    // is_flexible_grant가 Y이면 grant_time 추가
    const requestData = selectedPolicy?.is_flexible_grant === 'Y' && values.grantTime
      ? { ...baseRequestData, grant_time: values.grantTime }
      : baseRequestData

    requestVacation(requestData, {
      onSuccess: () => {
        onSubmitSuccess()
        onClose()
      }
    })
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='max-w-6xl max-h-[90vh] p-0 grid grid-rows-[auto_1fr_auto]'>
        <DialogHeader className='p-6 pb-4'>
          <div>
            <DialogTitle className='text-2xl font-bold'>
              {isOvertimeType ? t('application.compVacation') : t('application.vacationRequest')}
            </DialogTitle>
            <DialogDescription className='mt-2'>
              {t('application.writtenAt', { dateTime: dayjs().format('YYYY-MM-DD HH:mm') })}
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className='contents'>
          <ScrollArea>
            <div className='p-6 pt-0'>
              <div className='grid grid-cols-1 min-[64rem]:grid-cols-3 gap-6'>
                {/* 메인 폼 */}
                <div className='min-[64rem]:col-span-2'>
                  <Card>
                    <CardHeader>
                      <div className='flex items-center gap-2'>
                        <Calendar className='w-5 h-5 text-blue-600' />
                        <CardTitle>
                          {isOvertimeType ? t('application.compVacationInfo') : t('application.vacationInfo')}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className='space-y-6'>
                      <Controller
                        control={form.control}
                        name='title'
                        render={({ field, fieldState }) => (
                          <Field data-invalid={!!fieldState.error}>
                            <FieldLabel>
                              {t('application.titleLabel')}
                              <span className='text-destructive ml-0.5'>*</span>
                            </FieldLabel>
                            <Input
                              {...field}
                              placeholder={
                                isOvertimeType
                                  ? t('application.titleCompPlaceholder')
                                  : t('application.titleVacationPlaceholder')
                              }
                            />
                            <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                          </Field>
                        )}
                      />

                      <Controller
                        control={form.control}
                        name='vacationPolicyId'
                        render={({ field, fieldState }) => (
                          <Field data-invalid={!!fieldState.error}>
                            <FieldLabel>
                              {t('application.policyLabel')}
                              <span className='text-destructive ml-0.5'>*</span>
                            </FieldLabel>
                            <Select
                              value={field.value ? field.value.toString() : ''}
                              onValueChange={(value) => field.onChange(parseInt(value))}
                            >
                              <SelectTrigger>
                                {selectedPolicy ? (
                                  <span className='font-medium'>
                                    {selectedPolicy.vacation_policy_name} ({selectedPolicy.grant_time_str})
                                  </span>
                                ) : (
                                  <span className='text-muted-foreground'>{t('application.policySelectPlaceholder')}</span>
                                )}
                              </SelectTrigger>
                              <SelectContent>
                                {vacationPolicies.map((policy) => (
                                  <SelectItem
                                    key={policy.vacation_policy_id}
                                    value={policy.vacation_policy_id.toString()}
                                  >
                                    <div className='flex flex-col'>
                                      <div className='font-medium'>{policy.vacation_policy_name}</div>
                                      <div className='text-xs text-gray-500'>
                                        {policy.vacation_policy_desc} · {policy.grant_time_str}
                                      </div>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                          </Field>
                        )}
                      />

                      {isOvertimeType ? (
                        <>
                          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                            <Controller
                              control={form.control}
                              name='overtimeDate'
                              render={({ field, fieldState }) => (
                                <Field data-invalid={!!fieldState.error}>
                                  <FieldLabel>
                                    {t('application.overtimeDateLabel')}
                                    <span className='text-destructive ml-0.5'>*</span>
                                  </FieldLabel>
                                  <InputDatePicker
                                    value={field.value}
                                    onValueChange={field.onChange}
                                  />
                                  <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                                </Field>
                              )}
                            />
                            <Controller
                              control={form.control}
                              name='startTime'
                              render={({ field, fieldState }) => (
                                <Field data-invalid={!!fieldState.error}>
                                  <FieldLabel>
                                    {t('application.startTimeLabel')}
                                    <span className='text-destructive ml-0.5'>*</span>
                                  </FieldLabel>
                                  <InputTimePicker
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    placeholder="HH:mm"
                                  />
                                  <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                                </Field>
                              )}
                            />
                            <Controller
                              control={form.control}
                              name='endTime'
                              render={({ field, fieldState }) => (
                                <Field data-invalid={!!fieldState.error}>
                                  <FieldLabel>
                                    {t('application.endTimeLabel')}
                                    <span className='text-destructive ml-0.5'>*</span>
                                  </FieldLabel>
                                  <InputTimePicker
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    placeholder="HH:mm"
                                  />
                                  <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                                </Field>
                              )}
                            />
                          </div>

                          {/* is_flexible_grant가 Y이면 부여 시간 입력 */}
                          {selectedPolicy?.is_flexible_grant === 'Y' && (
                            <Controller
                              control={form.control}
                              name='grantTime'
                              render={({ field, fieldState }) => {
                                const totalValue = field.value || 0
                                const days = Math.floor(totalValue)
                                const remainder = totalValue - days
                                const hours = Math.floor(remainder / 0.125)
                                const minutes = (remainder - hours * 0.125) >= 0.0625 ? 30 : 0

                                const handleTimeChange = (newDays: number, newHours: number, newMinutes: number) => {
                                  const total = newDays + (newHours * 0.125) + (newMinutes === 30 ? 0.0625 : 0)
                                  field.onChange(total > 0 ? total : undefined)
                                }

                                return (
                                  <Field data-invalid={!!fieldState.error}>
                                    <FieldLabel>
                                      {t('application.grantTimeLabel')}
                                      <span className='text-destructive ml-0.5'>*</span>
                                    </FieldLabel>
                                    <div className={`grid ${selectedPolicy?.minute_grant_yn === 'Y' ? 'grid-cols-3' : 'grid-cols-2'} gap-4`}>
                                      <div className='flex flex-col'>
                                        <Input
                                          type='number'
                                          min='0'
                                          max='365'
                                          placeholder={t('application.dayUnit')}
                                          className='w-full'
                                          value={days || ''}
                                          onChange={(e) => {
                                            const newDays = e.target.value ? parseInt(e.target.value) : 0
                                            handleTimeChange(newDays, hours, minutes)
                                          }}
                                        />
                                        <p className='text-xs text-muted-foreground mt-1'>{t('application.dayUnit')}</p>
                                      </div>
                                      <div className='flex flex-col'>
                                        <Select
                                          value={hours.toString()}
                                          onValueChange={(value) => {
                                            handleTimeChange(days, parseInt(value), minutes)
                                          }}
                                        >
                                          <SelectTrigger className='w-full'>
                                            <SelectValue placeholder={t('application.hourUnit')} />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {[0, 1, 2, 3, 4, 5, 6, 7].map((h) => (
                                              <SelectItem key={h} value={h.toString()}>
                                                {t('application.nHours', { n: h })}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        <p className='text-xs text-muted-foreground mt-1'>{t('application.hourUnit')}</p>
                                      </div>
                                      {selectedPolicy?.minute_grant_yn === 'Y' && (
                                        <div className='flex flex-col'>
                                          <Select
                                            value={minutes.toString()}
                                            onValueChange={(value) => {
                                              handleTimeChange(days, hours, parseInt(value))
                                            }}
                                          >
                                            <SelectTrigger className='w-full'>
                                              <SelectValue placeholder={t('application.minuteUnit')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value='0'>{t('application.nMinutes', { n: 0 })}</SelectItem>
                                              <SelectItem value='30'>{t('application.nMinutes', { n: 30 })}</SelectItem>
                                            </SelectContent>
                                          </Select>
                                          <p className='text-xs text-muted-foreground mt-1'>{t('application.minuteUnit')}</p>
                                        </div>
                                      )}
                                    </div>
                                    <p className='text-sm text-muted-foreground mt-2'>
                                      {selectedPolicy?.minute_grant_yn === 'Y' ? t('application.timeSelectDescWithMin') : t('application.timeSelectDesc')}
                                      {field.value && field.value > 0 && (
                                        <span className='block mt-1 font-medium text-primary'>
                                          {t('application.totalTimeLabel')} {[
                                            days > 0 ? `${days}${tc('day')}` : '',
                                            hours > 0 ? `${hours}${tc('hour')}` : '',
                                            minutes > 0 && selectedPolicy?.minute_grant_yn === 'Y' ? `${minutes}${tc('minute')}` : ''
                                          ].filter(Boolean).join(' ')}
                                        </span>
                                      )}
                                    </p>
                                    <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                                  </Field>
                                )
                              }}
                            />
                          )}

                          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            <div className='space-y-2'>
                              <FieldLabel>{t('application.overtimeHoursLabel')}</FieldLabel>
                              <div className='h-9 px-3 border rounded-md flex items-center bg-gray-50'>
                                <Clock className='w-4 h-4 text-gray-400 mr-2' />
                                <span className='font-semibold'>
                                  {overtimeHours > 0 ? t('application.nHours', { n: overtimeHours }) : '-'}
                                </span>
                              </div>
                            </div>
                            <div className='space-y-2'>
                              <FieldLabel>{t('application.expectedCompTime')}</FieldLabel>
                              <div className='h-9 px-3 border rounded-md flex items-center bg-gray-50'>
                                <span className='text-lg font-bold text-blue-600'>
                                  {selectedPolicy?.is_flexible_grant === 'Y' && form.watch('grantTime')
                                    ? (() => {
                                        const grantTime = form.watch('grantTime') || 0
                                        const days = Math.floor(grantTime)
                                        const remainder = grantTime - days
                                        const hours = Math.floor(remainder / 0.125)
                                        const minutes = (remainder - hours * 0.125) >= 0.0625 ? 30 : 0
                                        return [
                                          days > 0 ? `${days}${tc('day')}` : '',
                                          hours > 0 ? `${hours}${tc('hour')}` : '',
                                          minutes > 0 && selectedPolicy?.minute_grant_yn === 'Y' ? `${minutes}${tc('minute')}` : ''
                                        ].filter(Boolean).join(' ') || '-'
                                      })()
                                    : overtimeHours > 0 ? t('application.nHours', { n: overtimeHours }) : '-'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <Controller
                            control={form.control}
                            name='overtimeDate'
                            render={({ field, fieldState }) => (
                              <Field data-invalid={!!fieldState.error}>
                                <FieldLabel>
                                  {t('application.dateLabel')}
                                  <span className='text-destructive ml-0.5'>*</span>
                                </FieldLabel>
                                <InputDatePicker
                                  value={field.value}
                                  onValueChange={field.onChange}
                                />
                                <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                              </Field>
                            )}
                          />

                          {/* is_flexible_grant가 Y이면 부여 시간 입력 */}
                          {selectedPolicy?.is_flexible_grant === 'Y' && (
                            <Controller
                              control={form.control}
                              name='grantTime'
                              render={({ field, fieldState }) => {
                                const totalValue = field.value || 0
                                const days = Math.floor(totalValue)
                                const remainder = totalValue - days
                                const hours = Math.floor(remainder / 0.125)
                                const minutes = (remainder - hours * 0.125) >= 0.0625 ? 30 : 0

                                const handleTimeChange = (newDays: number, newHours: number, newMinutes: number) => {
                                  const total = newDays + (newHours * 0.125) + (newMinutes === 30 ? 0.0625 : 0)
                                  field.onChange(total > 0 ? total : undefined)
                                }

                                return (
                                  <Field data-invalid={!!fieldState.error}>
                                    <FieldLabel>
                                      {t('application.grantTimeLabel')}
                                      <span className='text-destructive ml-0.5'>*</span>
                                    </FieldLabel>
                                    <div className={`grid ${selectedPolicy?.minute_grant_yn === 'Y' ? 'grid-cols-3' : 'grid-cols-2'} gap-4`}>
                                      <div className='flex flex-col'>
                                        <Input
                                          type='number'
                                          min='0'
                                          max='365'
                                          placeholder={t('application.dayUnit')}
                                          className='w-full'
                                          value={days || ''}
                                          onChange={(e) => {
                                            const newDays = e.target.value ? parseInt(e.target.value) : 0
                                            handleTimeChange(newDays, hours, minutes)
                                          }}
                                        />
                                        <p className='text-xs text-muted-foreground mt-1'>{t('application.dayUnit')}</p>
                                      </div>
                                      <div className='flex flex-col'>
                                        <Select
                                          value={hours.toString()}
                                          onValueChange={(value) => {
                                            handleTimeChange(days, parseInt(value), minutes)
                                          }}
                                        >
                                          <SelectTrigger className='w-full'>
                                            <SelectValue placeholder={t('application.hourUnit')} />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {[0, 1, 2, 3, 4, 5, 6, 7].map((h) => (
                                              <SelectItem key={h} value={h.toString()}>
                                                {t('application.nHours', { n: h })}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        <p className='text-xs text-muted-foreground mt-1'>{t('application.hourUnit')}</p>
                                      </div>
                                      {selectedPolicy?.minute_grant_yn === 'Y' && (
                                        <div className='flex flex-col'>
                                          <Select
                                            value={minutes.toString()}
                                            onValueChange={(value) => {
                                              handleTimeChange(days, hours, parseInt(value))
                                            }}
                                          >
                                            <SelectTrigger className='w-full'>
                                              <SelectValue placeholder={t('application.minuteUnit')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value='0'>{t('application.nMinutes', { n: 0 })}</SelectItem>
                                              <SelectItem value='30'>{t('application.nMinutes', { n: 30 })}</SelectItem>
                                            </SelectContent>
                                          </Select>
                                          <p className='text-xs text-muted-foreground mt-1'>{t('application.minuteUnit')}</p>
                                        </div>
                                      )}
                                    </div>
                                    <p className='text-sm text-muted-foreground mt-2'>
                                      {selectedPolicy?.minute_grant_yn === 'Y' ? t('application.timeSelectDescWithMin') : t('application.timeSelectDesc')}
                                      {field.value && field.value > 0 && (
                                        <span className='block mt-1 font-medium text-primary'>
                                          {t('application.totalTimeLabel')} {[
                                            days > 0 ? `${days}${tc('day')}` : '',
                                            hours > 0 ? `${hours}${tc('hour')}` : '',
                                            minutes > 0 && selectedPolicy?.minute_grant_yn === 'Y' ? `${minutes}${tc('minute')}` : ''
                                          ].filter(Boolean).join(' ')}
                                        </span>
                                      )}
                                    </p>
                                    <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                                  </Field>
                                )
                              }}
                            />
                          )}
                        </>
                      )}

                      <Controller
                        control={form.control}
                        name='reason'
                        render={({ field, fieldState }) => (
                          <Field data-invalid={!!fieldState.error}>
                            <FieldLabel>
                              {isOvertimeType ? t('application.compReasonLabel') : t('application.reasonLabel')}
                              <span className='text-destructive ml-0.5'>*</span>
                            </FieldLabel>
                            <Textarea
                              {...field}
                              rows={4}
                              placeholder={
                                isOvertimeType
                                  ? t('application.compReasonPlaceholder')
                                  : t('application.vacationReasonPlaceholder')
                              }
                            />
                            <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                          </Field>
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* 사이드바 */}
                <div className='min-[64rem]:col-span-1 space-y-4'>
                  {/* 승인자 지정 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className='text-lg flex items-center gap-2'>
                        <Users className='w-5 h-5' />
                        {t('application.approverTitle')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='space-y-4'>
                        {/* 자동 승인 안내 메시지 */}
                        {selectedPolicy && isAutoApproval && policyRequiredCount > 0 && (
                          <div className='p-3 rounded-md border border-green-200 bg-green-50'>
                            <p className='text-sm text-green-700 text-center'>
                              {t('application.autoApprovalMessage')}
                            </p>
                          </div>
                        )}

                        {/* 실제 필요 인원이 정책 요구 인원보다 적은 경우 안내 */}
                        {selectedPolicy && !isAutoApproval && actualRequiredCount > 0 && actualRequiredCount < policyRequiredCount && (
                          <div className='p-3 rounded-md border border-yellow-200 bg-yellow-50'>
                            <p className='text-sm text-yellow-700 text-center'>
                              {t('application.reducedApproverMessage', {
                                required: policyRequiredCount,
                                available: actualRequiredCount
                              })}
                            </p>
                          </div>
                        )}

                        {selectedPolicy && actualRequiredCount > 0 && !isAutoApproval ? (
                          Array.from({ length: actualRequiredCount }).map((_, index) => (
                            <div key={index}>
                              {index > 0 && <Separator className='my-4' />}
                              <div className={index > 0 ? 'mt-4' : ''}>
                                <h4 className='text-sm font-medium text-gray-700 mb-2'>
                                  {t('application.stepApprover', { step: index + 1 })}
                                </h4>
                                <Controller
                                  control={form.control}
                                  name={`approvers.${index}` as const}
                                  rules={{ required: t('application.approverRequired') }}
                                  render={({ field }) => (
                                    <Select value={field.value || ''} onValueChange={field.onChange}>
                                      <SelectTrigger>
                                        <SelectValue placeholder={t('application.approverSelectPlaceholder')} />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {approvers.map((approver) => (
                                          <SelectItem key={approver.user_id} value={approver.user_id}>
                                            <div className='flex items-center gap-2'>
                                              <Avatar className='w-6 h-6'>
                                                <AvatarFallback>{approver.user_name.charAt(0)}</AvatarFallback>
                                              </Avatar>
                                              <div className='text-left'>
                                                <div className='font-medium'>{approver.user_name}</div>
                                                <div className='text-xs text-gray-500'>{approver.department_name_kr}</div>
                                              </div>
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                />
                              </div>
                            </div>
                          ))
                        ) : !selectedPolicy ? (
                          <div className='p-3 rounded-md border border-dashed border-gray-300 bg-gray-50'>
                            <p className='text-sm text-gray-500 text-center'>{t('application.selectPolicyFirst')}</p>
                          </div>
                        ) : selectedPolicy && !isAutoApproval && actualRequiredCount === 0 && policyRequiredCount === 0 ? (
                          <div className='p-3 rounded-md border border-green-200 bg-green-50'>
                            <p className='text-sm text-green-700 text-center'>
                              {t('application.noApprovalRequired')}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>

                  {/* 신청 요약 */}
                  {(form.watch('title') || (isOvertimeType && overtimeHours > 0)) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className='text-lg'>{t('application.summaryTitle')}</CardTitle>
                      </CardHeader>
                      <CardContent className='space-y-3'>
                        {form.watch('title') && (
                          <div>
                            <p className='text-xs text-gray-500'>{t('application.titleLabel')}</p>
                            <p className='text-sm font-medium'>{form.watch('title')}</p>
                          </div>
                        )}
                        {selectedPolicy && (
                          <div>
                            <p className='text-xs text-gray-500'>{t('application.summaryVacationPolicy')}</p>
                            <p className='text-sm font-medium'>{selectedPolicy.vacation_policy_name}</p>
                          </div>
                        )}
                        {isOvertimeType && overtimeHours > 0 && (
                          <>
                            <div>
                              <p className='text-xs text-gray-500'>{t('application.summaryOvertimeHours')}</p>
                              <p className='text-sm font-medium'>{t('application.nHours', { n: overtimeHours })}</p>
                            </div>
                            <div>
                              <p className='text-xs text-gray-500'>{t('application.summaryExpectedComp')}</p>
                              <p className='text-sm font-bold text-blue-600'>
                                {t('application.nHours', { n: overtimeHours })}
                              </p>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* 하단 버튼 */}
          <DialogFooter className='p-6 pt-4 border-t bg-gray-50'>
            <div className='w-full'>
              <div className='flex items-center gap-2 text-sm text-gray-600 mb-4'>
                <AlertCircle className='w-4 h-4' />
                {t('application.noticeMessage')}
              </div>

              <div className='flex gap-3'>
                <Button type='button' variant='outline' onClick={handleClose} className='flex-1'>
                  {t('application.cancelBtn')}
                </Button>
                <Button
                  type='submit'
                  className='flex-1'
                  disabled={!form.formState.isValid || !isApproversValid}
                >
                  {t('application.submitBtn')}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { ApplicationFormDialog }
