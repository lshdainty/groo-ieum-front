import { Badge } from '@/shared/ui/shadcn/badge';
import { Button } from '@/shared/ui/shadcn/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/shadcn/dialog';
import { Field, FieldError, FieldLabel } from '@/shared/ui/shadcn/field';
import { Input } from '@/shared/ui/shadcn/input';
import { InputDatePicker } from '@/shared/ui/shadcn/inputDatePicker';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/shadcn/select';
import { Spinner } from '@/shared/ui/shadcn/spinner';
import { usePermission } from '@/entities/session';
import { useUser } from '@/entities/session';
import { useAddEvent } from '@/features/calendar/lib/hooks/use-add-event';
import type { TEventColor } from '@/features/calendar/model/types';
import { calendarTypes } from '@/features/calendar/model/types';
import { useAvailableVacationsQuery } from '@/entities/vacation';
import { useUsersQuery } from '@/entities/user';
import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import React, { Activity, useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from '@/shared/ui/shadcn/sonner';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

const colorClassMap: Record<TEventColor, string> = {
  blue: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300',
  green: 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300',
  red: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300',
  yellow: 'border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
  purple: 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300',
  orange: 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300',
  pink: 'border-pink-200 bg-pink-50 text-pink-700 dark:border-pink-800 dark:bg-pink-950 dark:text-pink-300',
  gray: 'border-neutral-200 bg-neutral-50 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300',
  teal: 'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-300',
};

const createFormSchema = (t: (key: string) => string) => z.object({
  selectedUser: z.string().optional(),
  calendarType: z.string().min(1, t('addEvent.calendarTypeRequired')),
  vacationType: z.string().optional(),
  desc: z.string().optional(),
  startDate: z.string().min(1, t('addEvent.startDateRequired')),
  endDate: z.string().min(1, t('addEvent.endDateRequired')),
  startHour: z.string().optional(),
  startMinute: z.string().optional(),
}).superRefine((data, ctx) => {
  const selectedCalendar = calendarTypes.find(c => c.id === data.calendarType);
  if (selectedCalendar?.type === 'vacation' && !data.vacationType) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: t('addEvent.useVacationRequired'),
      path: ['vacationType'],
    });
  }
});

type AddEventFormValues = z.infer<ReturnType<typeof createFormSchema>>;

interface AddEventDialogProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  startDate?: Date;
  endDate?: Date;
  startTime?: { hour: number; minute: number };
}

export const AddEventDialog: React.FC<AddEventDialogProps> = ({
  children,
  open: propOpen,
  onOpenChange,
  startDate: propStartDate,
  endDate: propEndDate,
  startTime
}) => {
  const { t } = useTranslation('calendar');
  const { t: tc } = useTranslation('common');
  const [internalOpen, setInternalOpen] = React.useState(false)
  const { loginUser } = useUser()
  const { hasAnyPermission } = usePermission()
  const formSchema = createFormSchema(t);

  // 권한 체크
  const canUseVacation = hasAnyPermission(['VACATION:USE', 'VACATION:MANAGE']);
  const canUseSchedule = hasAnyPermission(['SCHEDULE:WRITE', 'SCHEDULE:MANAGE']);
  const canManageVacation = hasAnyPermission(['VACATION:MANAGE']);

  // VACATION:MANAGE 권한이 있을 때만 유저 목록 조회
  const { data: users, isLoading: isLoadingUsers } = useUsersQuery();

  // 로그인 사용자가 users 목록에 없으면 추가 (SYSTEM 계정 지원)
  const userOptions = useMemo(() => {
    const list = users ?? [];
    if (loginUser && !list.find(u => u.user_id === loginUser.user_id)) {
      return [{ user_id: loginUser.user_id, user_name: loginUser.user_name } as typeof list[number], ...list];
    }
    return list;
  }, [users, loginUser]);

  // open 상태 관리: props가 있으면 props 사용, 없으면 내부 상태 사용
  const open = propOpen !== undefined ? propOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  // 날짜 기본값 설정: props로 받은 날짜가 있으면 사용, 없으면 오늘 날짜 (useMemo로 메모이제이션)
  const start = useMemo(() => propStartDate || new Date(), [propStartDate]);
  const end = useMemo(() => propEndDate || new Date(), [propEndDate]);

  const form = useForm<AddEventFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      selectedUser: '',
      calendarType: '',
      vacationType: '',
      desc: '',
      startDate: dayjs(start).format('YYYY-MM-DD'),
      endDate: dayjs(end).format('YYYY-MM-DD'),
      startHour: startTime?.hour.toString() || '9',
      startMinute: startTime?.minute.toString() || '0',
    }
  });

  const watchedCalendarType = form.watch('calendarType');
  const selectedCalendar = calendarTypes.find(c => c.id === watchedCalendarType);
  const isVacation = selectedCalendar?.type === 'vacation';
  const isDate = selectedCalendar?.isDate;

  const watchedStartDate = form.watch('startDate');
  const watchedSelectedUser = form.watch('selectedUser');

  // 휴가 조회 시 사용할 userId: VACATION:MANAGE 권한이 있으면 선택된 유저, 없으면 loginUser
  const targetUserId = canManageVacation && watchedSelectedUser
    ? watchedSelectedUser
    : loginUser?.user_id || '';

  useEffect(() => {
    const currentEndDate = form.getValues('endDate');
    if (watchedStartDate && currentEndDate) {
      const start = dayjs(watchedStartDate);
      const end = dayjs(currentEndDate);
      if (start.isAfter(end)) {
        form.setValue('endDate', watchedStartDate);
      }
    }
  }, [watchedStartDate, form]);

  const {data: vacations} = useAvailableVacationsQuery(
    targetUserId,
    watchedStartDate ? dayjs(watchedStartDate).format('YYYY-MM-DDTHH:mm:ss') : '',
    { enabled: open && !!watchedStartDate && !!targetUserId }
  );

  const { addEvent, isPending } = useAddEvent();

  const onSubmit = (values: AddEventFormValues) => {
    // VACATION:MANAGE 권한이 있으면 선택된 유저, 없으면 loginUser
    const userId = canManageVacation && values.selectedUser
      ? values.selectedUser
      : loginUser?.user_id || '';

    // 선택된 사용자의 근무타입 조회
    const targetUser = users?.find(u => u.user_id === userId);
    const userWorkTime = targetUser?.user_work_time;

    addEvent({
      userId,
      calendarType: values.calendarType,
      vacationType: values.vacationType,
      desc: values.desc,
      startDate: values.startDate,
      endDate: values.endDate,
      startHour: values.startHour,
      startMinute: values.startMinute,
      userWorkTime,
    }, {
      onSuccess: () => setOpen(false)
    });
  }

  useEffect(() => {
    if(open) {
      form.reset({
        selectedUser: '',
        calendarType: '',
        vacationType: '',
        desc: '',
        startDate: dayjs(start).format('YYYY-MM-DD'),
        endDate: dayjs(end).format('YYYY-MM-DD'),
        startHour: startTime?.hour.toString() || '9',
        startMinute: startTime?.minute.toString() || '0',
      });
    }
  }, [open, start, end, startTime]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className='min-[40rem]:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>{t('addEvent.title')}</DialogTitle>
          <DialogDescription>{t('addEvent.description')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="py-6 space-y-4">
            {/* VACATION:MANAGE 권한이 있을 때만 유저 선택 표시 */}
            <Activity mode={canManageVacation ? 'visible' : 'hidden'}>
              <Controller
                control={form.control}
                name="selectedUser"
                render={({ field, fieldState }) => (
                  <Field data-invalid={!!fieldState.error}>
                    <FieldLabel>
                      {t('addEvent.targetUser')}
                      <span className='text-destructive ml-0.5'>*</span>
                    </FieldLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingUsers}>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingUsers ? tc('loading') : t('addEvent.selectUserPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {userOptions.map((user) => (
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
            </Activity>
            <div className='flex flex-row gap-2'>
              <Controller
                control={form.control}
                name="calendarType"
                render={({ field, fieldState }) => (
                  <Field data-invalid={!!fieldState.error} className='flex-1'>
                    <FieldLabel>
                      {t('addEvent.calendarType')}
                      <span className='text-destructive ml-0.5'>*</span>
                    </FieldLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('addEvent.calendarType')} />
                      </SelectTrigger>
                      <SelectContent>
                        <Activity mode={canUseVacation ? 'visible' : 'hidden'}>
                          <SelectGroup>
                            <SelectLabel>{t('addEvent.vacation')}</SelectLabel>
                            {calendarTypes.filter(c => c.type === 'vacation').map(ct => (
                              <SelectItem key={ct.id} value={ct.id}>
                                <Badge className={colorClassMap[ct.color]}>
                                  {ct.name}
                                </Badge>
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </Activity>
                        <Activity mode={canUseSchedule ? 'visible' : 'hidden'}>
                          <SelectGroup>
                            <SelectLabel>{t('addEvent.schedule')}</SelectLabel>
                            {calendarTypes.filter(c => c.type === 'schedule').map(ct => (
                              <SelectItem key={ct.id} value={ct.id}>
                                <Badge className={colorClassMap[ct.color]}>
                                  {ct.name}
                                </Badge>
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </Activity>
                      </SelectContent>
                    </Select>
                    <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                  </Field>
                )}
              />
              {isVacation && (
                <Controller
                  control={form.control}
                  name="vacationType"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={!!fieldState.error} className='flex-1'>
                      <FieldLabel>
                        {t('addEvent.useVacation')}
                        <span className='text-destructive ml-0.5'>*</span>
                      </FieldLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('addEvent.useVacation')} />
                        </SelectTrigger>
                        <SelectContent>
                          {vacations?.vacations?.map(v => (
                            <SelectItem key={v.vacation_type} value={v.vacation_type}>
                              {`${v.vacation_type_name} (${v.remain_time_str})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                    </Field>
                  )}
                />
              )}
            </div>
            <Controller
              control={form.control}
              name="desc"
              render={({ field, fieldState }) => (
                <Field data-invalid={!!fieldState.error}>
                  <FieldLabel>
                    {t('addEvent.eventReason')}
                  </FieldLabel>
                  <Input placeholder={t('addEvent.eventReason')} {...field} />
                  <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                </Field>
              )}
            />
            <div className='flex flex-row gap-2 items-end'>
              <Controller
                control={form.control}
                name="startDate"
                render={({ field, fieldState }) => (
                  <Field data-invalid={!!fieldState.error} className='flex-1'>
                    <FieldLabel>
                      {t('addEvent.startDate')}
                      <span className='text-destructive ml-0.5'>*</span>
                    </FieldLabel>
                    <InputDatePicker
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder={t('addEvent.startDate')}
                    />
                    <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                  </Field>
                )}
              />
              <div className='pb-2'>~</div>
              <Controller
                control={form.control}
                name="endDate"
                render={({ field, fieldState }) => (
                  <Field data-invalid={!!fieldState.error} className='flex-1'>
                    <FieldLabel>
                      {t('addEvent.endDate')}
                      <span className='text-destructive ml-0.5'>*</span>
                    </FieldLabel>
                    <InputDatePicker
                      value={field.value}
                      onValueChange={(date) => {
                        const startDate = form.getValues('startDate');
                        if (startDate && date) {
                          if (dayjs(date).isBefore(dayjs(startDate))) {
                            toast.error(t('addEvent.endDateError'));
                            return;
                          }
                        }
                        field.onChange(date);
                      }}
                      placeholder={t('addEvent.endDate')}
                    />
                    <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                  </Field>
                )}
              />
            </div>
            {!isDate && watchedCalendarType && (
              <div className='flex flex-row gap-2'>
                <Controller
                  control={form.control}
                  name="startHour"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={!!fieldState.error} className='flex-1'>
                      <FieldLabel>
                        {t('addEvent.hour')}
                        <span className='text-destructive ml-0.5'>*</span>
                      </FieldLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('addEvent.hour')} />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 11 }, (_, i) => (
                            <SelectItem key={i+8} value={(i+8).toString()}>{`${i+8} ${t('addEvent.hourUnit')}`}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="startMinute"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={!!fieldState.error} className='flex-1'>
                      <FieldLabel>
                        {t('addEvent.minute')}
                        <span className='text-destructive ml-0.5'>*</span>
                      </FieldLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('addEvent.minute')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={'0'}>{`0 ${t('addEvent.minuteUnit')}`}</SelectItem>
                          <SelectItem value={'30'}>{`30 ${t('addEvent.minuteUnit')}`}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                    </Field>
                  )}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant='outline' type="button">{tc('cancel')}</Button>
            </DialogClose>
            <Button type='submit' disabled={!form.formState.isValid || isPending}>
              {isPending && <Spinner />}
              {t('addEvent.register')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}