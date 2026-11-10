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
import { toast } from '@/shared/ui/shadcn/sonner';
import { Spinner } from '@/shared/ui/shadcn/spinner';
import { usePermission } from '@/entities/session';
import { useUpdateEvent } from '@/features/calendar/lib/hooks/use-update-event';
import type { TEventColor } from '@/features/calendar/model/types';
import { calendarTypes } from '@/features/calendar/model/types';
import { useAvailableVacationsQuery } from '@/entities/vacation';
import { useVacationTypesQuery } from '@/entities/type';
import { useUsersQuery } from '@/entities/user';
import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import React, { Activity, useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { IEvent } from '@/features/calendar/model/interfaces';

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
  calendarType: z.string().min(1, t('addEvent.calendarTypeRequired')),
  vacationType: z.string().optional(),
  desc: z.string().optional(),
  startDate: z.string().min(1, t('addEvent.startDateRequired')),
  endDate: z.string().min(1, t('addEvent.endDateRequired')),
  startHour: z.string().optional(),
  startMinute: z.string().optional(),
});

type EditEventFormValues = z.infer<ReturnType<typeof createFormSchema>>;

interface EditEventDialogProps {
  children: React.ReactNode;
  event: IEvent;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** 바닥 왼쪽 [삭제] — 폰 휴가 기록 줄이 수정 폼으로 들어올 때(25-3 이 폼을 다시 짜면 그쪽 규칙을 따른다) */
  onDelete?: () => void;
  /** 휴가 종류만 고르게 한다 — 휴가 기록에서 연 폼(일정 종류로 바꾸면 휴가 기록 id 로 일정 수정이 나간다) */
  vacationOnly?: boolean;
}

export const EditEventDialog: React.FC<EditEventDialogProps> = ({
  children,
  event,
  open: propOpen,
  onOpenChange,
  onDelete,
  vacationOnly = false,
}) => {
  const { t } = useTranslation('calendar');
  const { t: tc } = useTranslation('common');
  const [internalOpen, setInternalOpen] = React.useState(false)
  const { hasAnyPermission } = usePermission()
  const formSchema = createFormSchema(t);

  // 권한 체크
  const canUseVacation = hasAnyPermission(['VACATION:USE', 'VACATION:MANAGE']);
  const canUseSchedule = hasAnyPermission(['SCHEDULE:WRITE', 'SCHEDULE:MANAGE']);

  // 사용자 목록 조회 (userWorkTime을 가져오기 위함)
  const { data: users } = useUsersQuery();

  // 기존 이벤트 타입 확인
  const currentEventType = event.type.type; // 'vacation' | 'schedule'

  // open 상태 관리: props가 있으면 props 사용, 없으면 내부 상태 사용
  const open = propOpen !== undefined ? propOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  // 이벤트 데이터에서 날짜와 시간 파싱
  const eventStartDate = useMemo(() => new Date(event.startDate), [event.startDate]);
  const eventEndDate = useMemo(() => new Date(event.endDate), [event.endDate]);

  const form = useForm<EditEventFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      calendarType: event.type.id,
      vacationType: event.vacationType || '',
      desc: event.description,
      startDate: dayjs(eventStartDate).format('YYYY-MM-DD'),
      endDate: dayjs(eventEndDate).format('YYYY-MM-DD'),
      startHour: eventStartDate.getHours().toString(),
      startMinute: eventStartDate.getMinutes().toString(),
    }
  });

  const watchedCalendarType = form.watch('calendarType');
  const selectedCalendar = calendarTypes.find(c => c.id === watchedCalendarType);
  const isVacation = selectedCalendar?.type === 'vacation';
  const isDate = selectedCalendar?.isDate;

  const watchedStartDate = form.watch('startDate');

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

  // 이벤트 소유자의 휴가 목록 조회 (VACATION:MANAGE 권한이 있으면 다른 유저 이벤트 수정 가능)
  const {data: vacations} = useAvailableVacationsQuery(
    event.user.id,
    dayjs(eventStartDate).format('YYYY-MM-DDTHH:mm:ss')
  );

  const { data: vacationTypes } = useVacationTypesQuery();

  // 현재 이벤트의 vacationType이 available vacations에 없는 경우 추가로 표시
  const currentVacationTypeNotInList = useMemo(() => {
    if (!event.vacationType) return null;
    const existsInAvailable = vacations?.vacations?.some(
      v => v.vacation_type === event.vacationType
    );
    if (existsInAvailable) return null;

    // vacationTypes에서 해당 타입 정보 찾기
    const typeInfo = vacationTypes?.find(vt => vt.code === event.vacationType);
    if (!typeInfo) return null;

    return {
      vacation_type: typeInfo.code,
      vacation_type_name: typeInfo.name
    };
  }, [event.vacationType, vacations?.vacations, vacationTypes]);

  const { updateFromForm, isPending } = useUpdateEvent();

  const onSubmit = (values: EditEventFormValues) => {
    // 이벤트 소유자의 근무타입 조회
    const targetUser = users?.find(u => u.user_id === event.user.id);
    const userWorkTime = targetUser?.user_work_time;

    // 이벤트 소유자의 ID 사용 (VACATION:MANAGE 권한이 있으면 다른 유저 이벤트 수정 가능)
    updateFromForm({
      eventId: event.id,
      kind: event.kind,
      userId: event.user.id,
      calendarType: values.calendarType,
      vacationType: values.vacationType,
      desc: values.desc,
      startDate: values.startDate,
      endDate: values.endDate,
      startHour: values.startHour,
      startMinute: values.startMinute,
      userWorkTime,
    }).then(() => setOpen(false)).catch(() => undefined);
  }

  useEffect(() => {
    if(open) {
      form.reset({
        calendarType: event.type.id,
        vacationType: event.vacationType || '',
        desc: event.description,
        startDate: dayjs(eventStartDate).format('YYYY-MM-DD'),
        endDate: dayjs(eventEndDate).format('YYYY-MM-DD'),
        startHour: eventStartDate.getHours().toString(),
        startMinute: eventStartDate.getMinutes().toString(),
      });
    }
  }, [open, event, eventStartDate, eventEndDate, form]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className='min-[40rem]:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>{t('editEvent.title')}</DialogTitle>
          <DialogDescription>{t('editEvent.description')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="py-6 space-y-4">
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('addEvent.calendarType')} />
                      </SelectTrigger>
                      <SelectContent>
                        <Activity mode={currentEventType === 'vacation' ? 'visible' : 'hidden'}>
                          <SelectGroup>
                            <SelectLabel>{t('addEvent.vacation')}</SelectLabel>
                            {calendarTypes.filter(c => c.type === 'vacation').map(ct => {
                              // 기존 타입이 아니고 권한도 없으면 disabled
                              const isCurrentType = ct.id === event.type.id;
                              const isDisabled = !canUseVacation && !isCurrentType;
                              return (
                                <SelectItem key={ct.id} value={ct.id} disabled={isDisabled}>
                                  <Badge className={colorClassMap[ct.color]}>
                                    {ct.name}
                                  </Badge>
                                </SelectItem>
                              );
                            })}
                          </SelectGroup>
                        </Activity>
                        <Activity mode={!vacationOnly && currentEventType === 'schedule' ? 'visible' : 'hidden'}>
                          <SelectGroup>
                            <SelectLabel>{t('addEvent.schedule')}</SelectLabel>
                            {calendarTypes.filter(c => c.type === 'schedule').map(ct => {
                              // 기존 타입이 아니고 권한도 없으면 disabled
                              const isCurrentType = ct.id === event.type.id;
                              const isDisabled = !canUseSchedule && !isCurrentType;
                              return (
                                <SelectItem key={ct.id} value={ct.id} disabled={isDisabled}>
                                  <Badge className={colorClassMap[ct.color]}>
                                    {ct.name}
                                  </Badge>
                                </SelectItem>
                              );
                            })}
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('addEvent.useVacation')} />
                        </SelectTrigger>
                        <SelectContent>
                          {currentVacationTypeNotInList && (
                            <SelectItem
                              key={currentVacationTypeNotInList.vacation_type}
                              value={currentVacationTypeNotInList.vacation_type}
                            >
                              {`${currentVacationTypeNotInList.vacation_type_name} (0일)`}
                            </SelectItem>
                          )}
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
                      <Select onValueChange={field.onChange} value={field.value}>
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
                      <Select onValueChange={field.onChange} value={field.value}>
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
            {onDelete && (
              <Button variant='ghost' type='button' className='text-destructive hover:text-destructive min-[40rem]:mr-auto' onClick={onDelete} data-edit-delete>
                {tc('delete')}
              </Button>
            )}
            <DialogClose asChild>
              <Button variant='outline' type="button">{tc('cancel')}</Button>
            </DialogClose>
            <Button type='submit' disabled={!form.formState.isValid || isPending}>
              {isPending && <Spinner />}
              {tc('edit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
