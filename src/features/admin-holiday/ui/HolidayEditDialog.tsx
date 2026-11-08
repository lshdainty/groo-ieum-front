import { Button } from '@/shared/ui/shadcn/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/shadcn/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/shadcn/form';
import { Input } from '@/shared/ui/shadcn/input';
import { InputDatePicker } from '@/shared/ui/shadcn/inputDatePicker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select';
import { useCountryCodeTypesQuery } from '@/entities/type';
import { type GetHolidaysResp, type PostHolidayReq } from '@/entities/holiday';
import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import { Spinner } from '@/shared/ui/shadcn/spinner';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

const createFormSchema = (t: (key: string) => string) => z.object({
  holiday_name: z.string().min(1, { message: t('holiday.nameRequired') }),
  holiday_icon: z.string().optional().refine((val) => {
    if (!val) return true;
    return val.length <= 2;
  }, { message: t('holiday.iconMaxLength') }),
  holiday_date: z.string().min(1, { message: t('holiday.dateRequired') }),
  holiday_type: z.string().min(1, { message: t('holiday.typeRequired') }),
  lunar_yn: z.string().min(1, { message: t('holiday.lunarYnRequired') }),
  is_recurring: z.string().min(1, { message: t('holiday.recurringYnRequired') }),
  lunar_date: z.string().optional(),
  country_code: z.string().min(1, { message: t('holiday.countryCodeRequired') }),
});

type HolidayFormValues = z.infer<ReturnType<typeof createFormSchema>>;

interface HolidayEditDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingHoliday: GetHolidaysResp | null;
  onSave: (data: PostHolidayReq) => void;
  trigger?: React.ReactNode;
  isLoading?: boolean;
}

const HolidayEditDialog = ({
  isOpen,
  onOpenChange,
  editingHoliday,
  onSave,
  trigger,
  isLoading = false,
}: HolidayEditDialogProps) => {
  const { t } = useTranslation('admin');
  const { t: tc } = useTranslation('common');
  const formSchema = createFormSchema(t);
  const { data: countryTypes } = useCountryCodeTypesQuery();

  const form = useForm<HolidayFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      holiday_name: '',
      holiday_icon: '',
      holiday_date: '',
      holiday_type: '',
      lunar_yn: 'N',
      is_recurring: 'Y',
      lunar_date: '',
      country_code: 'KR',
    },
  });

  useEffect(() => {
    if (editingHoliday) {
      form.reset({
        ...editingHoliday,
        lunar_date: editingHoliday.lunar_date ?? '',
        holiday_icon: editingHoliday.holiday_icon ?? '',
      });
    } else {
      form.reset({
        holiday_name: '',
        holiday_icon: '',
        holiday_date: '',
        holiday_type: '',
        lunar_yn: 'N',
        is_recurring: 'Y',
        lunar_date: '',
        country_code: 'KR',
      });
    }
  }, [editingHoliday, form]);

  const onSubmit = (values: HolidayFormValues) => {
    onSave({ ...values, holiday_icon: values.holiday_icon || '', lunar_date: values.lunar_date || '' });
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {trigger && (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      )}
      <DialogContent className='min-[40rem]:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>
            {editingHoliday ? t('holiday.editTitle') : t('holiday.addTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('holiday.formDescription')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='holiday_name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('holiday.name')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('holiday.namePlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='holiday_icon'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('holiday.icon')}</FormLabel>
                    <FormControl>
                      <Input
                        type='text'
                        maxLength={2}
                        placeholder='🎉'
                        {...field}
                        className='text-center text-xl'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='holiday_date'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('holiday.date')}</FormLabel>
                    <FormControl>
                      <InputDatePicker
                        value={field.value ? dayjs(field.value).format('YYYY-MM-DD') : ''}
                        onValueChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='holiday_type'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('holiday.type')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('holiday.typePlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='PUBLIC'>{t('holiday.typePublic')}</SelectItem>
                        <SelectItem value='ETC'>{t('holiday.typeEtc')}</SelectItem>
                        <SelectItem value='SUBSTITUTE'>{t('holiday.typeSubstitute')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='lunar_yn'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('holiday.lunarYn')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('holiday.lunarYn')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='Y'>{t('holiday.lunarYes')}</SelectItem>
                        <SelectItem value='N'>{t('holiday.lunarNo')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='is_recurring'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('holiday.recurringYn')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('holiday.recurringPlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='Y'>{tc('yes')}</SelectItem>
                        <SelectItem value='N'>{tc('no')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {form.watch('lunar_yn') === 'Y' && (
              <FormField
                control={form.control}
                name='lunar_date'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('holiday.lunarDate')}</FormLabel>
                    <FormControl>
                      <InputDatePicker
                        value={field.value ? dayjs(field.value).format('YYYY-MM-DD') : ''}
                        onValueChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name='country_code'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('holiday.countryCode')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('holiday.countryPlaceholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {countryTypes?.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='flex justify-end gap-2 pt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={handleCancel}
                disabled={isLoading}
              >
                {tc('cancel')}
              </Button>
              <Button type='submit' disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Spinner className='mr-2 h-4 w-4' />
                    {tc('saving')}
                  </>
                ) : (
                  editingHoliday ? tc('edit') : tc('add')
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export { HolidayEditDialog }