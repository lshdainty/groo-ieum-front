import { Button } from '@/shared/ui/shadcn/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/shadcn/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/shadcn/form';
import { Input } from '@/shared/ui/shadcn/input';
import { InputDatePicker } from '@/shared/ui/shadcn/inputDatePicker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select';
import { Spinner } from '@/shared/ui/shadcn/spinner';
import { Textarea } from '@/shared/ui/shadcn/textarea';
import { type CreateNoticeReq, type NoticeListResp } from '@/entities/notice';
import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

const createFormSchema = (t: (key: string) => string) => z.object({
  title: z.string().min(1, { message: t('notice.titleRequired') }),
  content: z.string().min(1, { message: t('notice.contentRequired') }),
  notice_type: z.string().min(1, { message: t('notice.typeRequired') }),
  is_pinned: z.string().min(1, { message: t('notice.pinnedRequired') }),
  start_date: z.string().min(1, { message: t('notice.startDateRequired') }),
  end_date: z.string().min(1, { message: t('notice.endDateRequired') }),
});

type NoticeFormValues = z.infer<ReturnType<typeof createFormSchema>>;

interface NoticeEditDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingNotice: NoticeListResp | null;
  onSave: (data: CreateNoticeReq) => void;
  trigger?: React.ReactNode;
  isPending?: boolean;
}

const NoticeEditDialog = ({
  isOpen,
  onOpenChange,
  editingNotice,
  onSave,
  trigger,
  isPending = false,
}: NoticeEditDialogProps) => {
  const { t } = useTranslation('admin');
  const { t: tc } = useTranslation('common');
  const formSchema = createFormSchema(t);

  const form = useForm<NoticeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
      notice_type: 'GENERAL',
      is_pinned: 'N',
      start_date: dayjs().format('YYYY-MM-DD'),
      end_date: dayjs().add(30, 'day').format('YYYY-MM-DD'),
    },
  });

  useEffect(() => {
    if (editingNotice) {
      form.reset({
        title: editingNotice.title,
        content: '',
        notice_type: editingNotice.notice_type,
        is_pinned: editingNotice.is_pinned,
        start_date: editingNotice.start_date,
        end_date: editingNotice.end_date,
      });
    } else {
      form.reset({
        title: '',
        content: '',
        notice_type: 'GENERAL',
        is_pinned: 'N',
        start_date: dayjs().format('YYYY-MM-DD'),
        end_date: dayjs().add(30, 'day').format('YYYY-MM-DD'),
      });
    }
  }, [editingNotice, form]);

  const onSubmit = (values: NoticeFormValues) => {
    const payload: CreateNoticeReq = {
      writer_id: '',
      title: values.title,
      content: values.content,
      notice_type: values.notice_type as 'GENERAL' | 'URGENT' | 'EVENT' | 'MAINTENANCE',
      is_pinned: values.is_pinned as 'Y' | 'N',
      start_date: dayjs(values.start_date).format('YYYY-MM-DD'),
      end_date: dayjs(values.end_date).format('YYYY-MM-DD'),
    };
    onSave(payload);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button className='flex items-center gap-2'>
            {t('notice.addBtn')}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className='min-[40rem]:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle>
            {editingNotice ? t('notice.editTitle') : t('notice.addTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('notice.formDescription')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('notice.titleLabel')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('notice.titlePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='content'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('notice.contentLabel')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('notice.contentPlaceholder')}
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='notice_type'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('notice.type')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('notice.typePlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='GENERAL'>{t('notice.typeGeneral')}</SelectItem>
                        <SelectItem value='URGENT'>{t('notice.typeUrgent')}</SelectItem>
                        <SelectItem value='EVENT'>{t('notice.typeEvent')}</SelectItem>
                        <SelectItem value='MAINTENANCE'>{t('notice.typeMaintenance')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='is_pinned'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('notice.pinned')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('notice.pinnedPlaceholder')} />
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
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='start_date'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('notice.startDate')}</FormLabel>
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
                name='end_date'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('notice.endDate')}</FormLabel>
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
            </div>
            <div className='flex justify-end gap-2 pt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={handleCancel}
                disabled={isPending}
              >
                {tc('cancel')}
              </Button>
              <Button type='submit' disabled={isPending}>
                {isPending && <Spinner />}
                {editingNotice ? tc('edit') : tc('add')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export { NoticeEditDialog }
