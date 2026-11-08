import { Button } from '@/shared/ui/shadcn/button';
import { Checkbox } from '@/shared/ui/shadcn/checkbox';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/shadcn/dialog';
import { Field, FieldError, FieldLabel } from '@/shared/ui/shadcn/field';
import { Input } from '@/shared/ui/shadcn/input';
import { InputDatePicker } from '@/shared/ui/shadcn/inputDatePicker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/shadcn/select';
import { Textarea } from '@/shared/ui/shadcn/textarea';
import { useEffectiveTypesQuery, useExpirationTypesQuery } from '@/entities/type';
import { useUsersQuery } from '@/entities/user';
import { usePostManualGrantVacationMutation } from '@/entities/vacation';
import { useUserAssignedVacationPoliciesQuery } from '@/entities/vacation-policy';
import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

const createFormSchema = (t: (key: string) => string) => z.object({
  selectedUser: z.string().min(1, { message: t('grant.selectUser') }),
  vacationPolicy: z.string().min(1, { message: t('grant.selectPolicy') }),
  grantDate: z.string().optional(),
  expiryDate: z.string().optional(),
  grantTime: z.number().min(0.0625, { message: t('grant.enterGrantTime') }),
  description: z.string().min(1, { message: t('grant.enterReason') }),
});

type VacationGrantFormValues = z.infer<ReturnType<typeof createFormSchema>>;

interface VacationGrantDialogProps {
  open: boolean;
  onClose: () => void;
}

const VacationGrantDialog = ({
  open,
  onClose,
}: VacationGrantDialogProps) => {
  const { t } = useTranslation('vacation');
  const { t: tc } = useTranslation('common');
  const formSchema = createFormSchema(t);
  const { data: users, isLoading: isLoadingUsers } = useUsersQuery();
  const { mutate: grantVacation, isPending } = usePostManualGrantVacationMutation();
  const { data: effectiveTypes = [] } = useEffectiveTypesQuery();
  const { data: expirationTypes = [] } = useExpirationTypesQuery();
  const [useCustomDates, setUseCustomDates] = useState(false);

  const form = useForm<VacationGrantFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      selectedUser: '',
      vacationPolicy: '',
      grantDate: undefined,
      expiryDate: undefined,
      grantTime: undefined,
      description: '',
    },
  });

  const selectedUser = form.watch('selectedUser');
  const vacationPolicyId = form.watch('vacationPolicy');
  const grantTime = form.watch('grantTime');
  const description = form.watch('description');
  const grantDate = form.watch('grantDate');
  const expiryDate = form.watch('expiryDate');

  // 선택된 사용자의 MANUAL_GRANT 휴가 정책 조회
  const { data: vacationPolicies, isLoading: isLoadingPolicies } = useUserAssignedVacationPoliciesQuery(
    selectedUser,
    undefined,
    'MANUAL_GRANT'
  );

  // 선택된 정책 찾기
  const selectedPolicy = vacationPolicies?.find(
    policy => policy.vacation_policy_id.toString() === vacationPolicyId
  );

  // 부여 시간이 유연한지 여부
  const isFlexibleGrant = selectedPolicy?.is_flexible_grant === 'Y';

  // effective_type과 expiration_type을 한글로 변환
  const getEffectiveTypeName = (code: string) => {
    return effectiveTypes.find(type => type.code === code)?.name || code;
  };

  const getExpirationTypeName = (code: string) => {
    return expirationTypes.find(type => type.code === code)?.name || code;
  };

  // 저장 버튼 활성화 조건 체크
  const isFormValid = () => {
    // 기본 필수값 체크
    if (!selectedUser || !vacationPolicyId || !grantTime || !description) {
      return false;
    }

    // 직접 지정 옵션을 선택한 경우 날짜도 필수
    if (useCustomDates) {
      if (!grantDate || !expiryDate) {
        return false;
      }
    }

    return true;
  };

  // Dialog가 열릴 때 폼 초기화
  useEffect(() => {
    if (open) {
      form.reset({
        selectedUser: '',
        vacationPolicy: '',
        grantDate: undefined,
        expiryDate: undefined,
        grantTime: undefined,
        description: '',
      });
      setUseCustomDates(false);
    }
  }, [open, form]);

  // 휴가 정책 선택 시 is_flexible_grant가 'N'이면 grant_time 자동 설정
  useEffect(() => {
    if (selectedPolicy) {
      if (selectedPolicy.is_flexible_grant === 'N') {
        // grant_time을 그대로 설정 (소수점 형식)
        form.setValue('grantTime', selectedPolicy.grant_time);
      } else {
        // is_flexible_grant가 'Y'인 경우, 기존 값 유지 또는 초기화
        form.setValue('grantTime', 0);
      }
    }
  }, [selectedPolicy, form]);

  const onSubmit = (values: VacationGrantFormValues) => {
    // 직접 지정을 선택한 경우 날짜 검증
    if (useCustomDates) {
      if (!values.grantDate) {
        form.setError('grantDate', { message: t('grant.selectStartDate') });
        return;
      }
      if (!values.expiryDate) {
        form.setError('expiryDate', { message: t('grant.selectEndDate') });
        return;
      }
    }

    // LocalDateTime 형식으로 변환 (YYYY-MM-DDTHH:mm:ss) 또는 null
    const grantDateTime = useCustomDates && values.grantDate ? `${values.grantDate}T00:00:00` : null;
    const expiryDateTime = useCustomDates && values.expiryDate ? `${values.expiryDate}T23:59:59` : null;

    grantVacation({
      user_id: values.selectedUser,
      vacation_policy_id: parseInt(values.vacationPolicy),
      grant_time: values.grantTime!,
      grant_date: grantDateTime!,
      expiry_date: expiryDateTime!,
      grant_desc: values.description,
    }, {
      onSuccess: () => {
        form.reset();
        onClose();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='min-[40rem]:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>{t('grant.title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className='p-6 space-y-4'>
            {/* 대상 사용자 */}
            <Controller
              control={form.control}
              name='selectedUser'
              render={({ field, fieldState }) => (
                <Field data-invalid={!!fieldState.error}>
                  <FieldLabel>
                    {t('grant.targetUser')} <span className='text-red-500'>*</span>
                  </FieldLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingUsers}>
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingUsers ? tc('loading') : t('grant.selectUserPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {users?.map((user) => (
                        <SelectItem key={user.user_id} value={user.user_id}>
                          {user.user_name} ({user.user_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                </Field>
              )}
            />

            {selectedUser && (
              <>
                {/* 휴가 정책 */}
                <Controller
                  control={form.control}
                  name='vacationPolicy'
                  render={({ field, fieldState }) => (
                    <Field data-invalid={!!fieldState.error}>
                      <FieldLabel>
                        {t('grant.policyLabel')} <span className='text-red-500'>*</span>
                      </FieldLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isLoadingPolicies || !vacationPolicies || vacationPolicies.length === 0}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              isLoadingPolicies
                                ? tc('loading')
                                : vacationPolicies && vacationPolicies.length === 0
                                  ? t('grant.noManualGrantPolicy')
                                  : t('grant.selectPolicyPlaceholder')
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {vacationPolicies?.map((policy) => (
                            <SelectItem
                              key={policy.vacation_policy_id}
                              value={policy.vacation_policy_id.toString()}
                            >
                              {policy.vacation_policy_name} ({policy.vacation_type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                    </Field>
                  )}
                />

                {/* 부여일, 만료일 직접 지정 옵션 */}
                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id='useCustomDates'
                    checked={useCustomDates}
                    onCheckedChange={(checked) => {
                      setUseCustomDates(checked === true);
                      if (!checked) {
                        form.setValue('grantDate', undefined);
                        form.setValue('expiryDate', undefined);
                        form.clearErrors(['grantDate', 'expiryDate']);
                      } else {
                        form.setValue('grantDate', dayjs().format('YYYY-MM-DD'));
                        form.setValue('expiryDate', dayjs().format('YYYY-MM-DD'));
                      }
                    }}
                  />
                  <label
                    htmlFor='useCustomDates'
                    className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer'
                  >
                    {t('grant.customDateOption', { comma: ',' })}
                  </label>
                </div>

                {!useCustomDates && selectedPolicy && (
                  <div className='grid grid-cols-2 gap-4'>
                    {/* 유효기간 시작일자 정책 표시 */}
                    <Field>
                      <FieldLabel>{t('grant.validityStart')}</FieldLabel>
                      <div className='flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm'>
                        {selectedPolicy.effective_type ? getEffectiveTypeName(selectedPolicy.effective_type) : t('grant.policyDefault')}
                      </div>
                      <p className='text-xs text-muted-foreground mt-1'>
                        {t('grant.startDateRule')}
                      </p>
                    </Field>

                    {/* 유효기간 만료일자 정책 표시 */}
                    <Field>
                      <FieldLabel>{t('grant.validityEnd')}</FieldLabel>
                      <div className='flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm'>
                        {selectedPolicy.expiration_type ? getExpirationTypeName(selectedPolicy.expiration_type) : t('grant.policyDefault')}
                      </div>
                      <p className='text-xs text-muted-foreground mt-1'>
                        {t('grant.endDateRule')}
                      </p>
                    </Field>
                  </div>
                )}

                {useCustomDates && (
                  <div className='grid grid-cols-2 gap-4'>
                    {/* 유효기간 시작일자 */}
                    <Controller
                      control={form.control}
                      name='grantDate'
                      render={({ field, fieldState }) => (
                        <Field data-invalid={!!fieldState.error}>
                          <FieldLabel>
                            {t('grant.validityStart')} <span className='text-red-500'>*</span>
                          </FieldLabel>
                          <InputDatePicker
                            value={field.value}
                            onValueChange={(value) => field.onChange(value)}
                          />
                          <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                        </Field>
                      )}
                    />

                    {/* 유효기간 만료일자 */}
                    <Controller
                      control={form.control}
                      name='expiryDate'
                      render={({ field, fieldState }) => (
                        <Field data-invalid={!!fieldState.error}>
                          <FieldLabel>
                            {t('grant.validityEnd')} <span className='text-red-500'>*</span>
                          </FieldLabel>
                          <InputDatePicker
                            value={field.value}
                            onValueChange={(value) => field.onChange(value)}
                          />
                          <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                        </Field>
                      )}
                    />
                  </div>
                )}

                {/* 부여 시간 */}
                <Controller
                  control={form.control}
                  name='grantTime'
                  render={({ field, fieldState }) => {
                    const totalValue = field.value || 0;
                    const days = Math.floor(totalValue);
                    const remainder = totalValue - days;
                    const hours = Math.floor(remainder / 0.125);
                    const minutes = (remainder - hours * 0.125) >= 0.0625 ? 30 : 0;

                    const handleTimeChange = (newDays: number, newHours: number, newMinutes: number) => {
                      const total = newDays + (newHours * 0.125) + (newMinutes === 30 ? 0.0625 : 0);
                      field.onChange(total > 0 ? total : undefined);
                    };

                    const isDisabled = !isFlexibleGrant;

                    return (
                      <Field data-invalid={!!fieldState.error}>
                        <FieldLabel>
                          {t('grant.grantTime')} <span className='text-red-500'>*</span>
                        </FieldLabel>
                        <div className={`grid ${selectedPolicy?.minute_grant_yn === 'Y' ? 'grid-cols-3' : 'grid-cols-2'} gap-4`}>
                          <div className='flex flex-col'>
                            <Input
                              type='number'
                              min='0'
                              max='365'
                              placeholder={t('grant.day')}
                              className='w-full'
                              value={days || ''}
                              onChange={(e) => {
                                const newDays = e.target.value ? parseInt(e.target.value) : 0;
                                handleTimeChange(newDays, hours, minutes);
                              }}
                              disabled={isDisabled}
                            />
                            <p className='text-xs text-muted-foreground mt-1'>{t('grant.day')}</p>
                          </div>
                          <div className='flex flex-col'>
                            <Select
                              value={hours.toString()}
                              onValueChange={(value) => {
                                handleTimeChange(days, parseInt(value), minutes);
                              }}
                              disabled={isDisabled}
                            >
                              <SelectTrigger className='w-full'>
                                <SelectValue placeholder={t('grant.hour')} />
                              </SelectTrigger>
                              <SelectContent>
                                {[0, 1, 2, 3, 4, 5, 6, 7].map((h) => (
                                  <SelectItem key={h} value={h.toString()}>
                                    {t('grant.nHours', { n: h })}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className='text-xs text-muted-foreground mt-1'>{t('grant.hour')}</p>
                          </div>
                          {selectedPolicy?.minute_grant_yn === 'Y' && (
                            <div className='flex flex-col'>
                              <Select
                                value={minutes.toString()}
                                onValueChange={(value) => {
                                  handleTimeChange(days, hours, parseInt(value));
                                }}
                                disabled={isDisabled}
                              >
                                <SelectTrigger className='w-full'>
                                  <SelectValue placeholder={t('grant.minute')} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value='0'>{t('grant.nMinutes', { n: 0 })}</SelectItem>
                                  <SelectItem value='30'>{t('grant.nMinutes', { n: 30 })}</SelectItem>
                                </SelectContent>
                              </Select>
                              <p className='text-xs text-muted-foreground mt-1'>{t('grant.minute')}</p>
                            </div>
                          )}
                        </div>
                        <p className='text-sm text-muted-foreground mt-2'>
                          {isDisabled
                            ? t('grant.fixedTimePolicy')
                            : selectedPolicy?.minute_grant_yn === 'Y' ? t('grant.selectTimeDescWithMin') : t('grant.selectTimeDesc')}
                          {field.value && field.value > 0 && (
                            <span className='block mt-1 font-medium text-primary'>
                              {t('grant.totalTime', { time: [
                                days > 0 ? `${days}${t('grant.day')}` : '',
                                hours > 0 ? `${hours}${t('grant.hour')}` : '',
                                minutes > 0 && selectedPolicy?.minute_grant_yn === 'Y' ? `${minutes}${t('grant.minute')}` : ''
                              ].filter(Boolean).join(' ') })}
                            </span>
                          )}
                        </p>
                        <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                      </Field>
                    );
                  }}
                />

                {/* 부여 사유 */}
                <Controller
                  control={form.control}
                  name='description'
                  render={({ field, fieldState }) => (
                    <Field data-invalid={!!fieldState.error}>
                      <FieldLabel>
                        {t('grant.grantReason')} <span className='text-red-500'>*</span>
                      </FieldLabel>
                      <Textarea
                        {...field}
                        placeholder={t('grant.grantReasonPlaceholder')}
                        rows={4}
                        className='resize-none'
                      />
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                    </Field>
                  )}
                />
              </>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type='button' variant='secondary' disabled={isPending}>
                {tc('cancel')}
              </Button>
            </DialogClose>
            <Button type='submit' disabled={isPending || !isFormValid()}>
              {isPending ? t('grant.processing') : tc('save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { VacationGrantDialog }
