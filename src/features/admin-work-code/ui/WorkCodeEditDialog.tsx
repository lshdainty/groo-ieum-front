import { Button } from '@/shared/ui/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/shadcn/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/ui/shadcn/form';
import { Input } from '@/shared/ui/shadcn/input';
import { WorkCodeResp, usePostCreateWorkCodeMutation, usePutUpdateWorkCodeMutation } from '@/entities/work'
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as z from 'zod';

const createFormSchema = (t: (key: string) => string) => z.object({
  work_code: z.string().min(1, t('codeRequired')),
  work_code_name: z.string().min(1, t('codeNameRequired')),
  parent_work_code_id: z.number().optional(),
  order_seq: z.coerce.number().optional(),
});

type FormValues = z.infer<ReturnType<typeof createFormSchema>>;

interface WorkCodeEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workCode: WorkCodeResp | null;
  parentWorkCodeId?: number; // For creating child codes
  onSuccess?: () => void;
}

const WorkCodeEditDialog = ({
  open,
  onOpenChange,
  workCode,
  parentWorkCodeId,
  onSuccess
}: WorkCodeEditDialogProps) => {
  const { t } = useTranslation('work');
  const { t: tc } = useTranslation('common');
  const { mutate: createWorkCode, isPending: isCreatePending } = usePostCreateWorkCodeMutation();
  const { mutate: updateWorkCode, isPending: isUpdatePending } = usePutUpdateWorkCodeMutation();

  const isPending = isCreatePending || isUpdatePending;
  const isEdit = !!workCode;
  const formSchema = createFormSchema(t);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any, // Temporary fix for type mismatch
    defaultValues: {
      work_code: '',
      work_code_name: '',
      parent_work_code_id: undefined,
      order_seq: 0,
    },
  });

  useEffect(() => {
    if (open) {
      if (workCode) {
        form.reset({
          work_code: workCode.work_code,
          work_code_name: workCode.work_code_name,
          parent_work_code_id: workCode.parent_work_code_id,
          order_seq: workCode.order_seq,
        });
      } else {
        form.reset({
          work_code: '',
          work_code_name: '',
          parent_work_code_id: parentWorkCodeId,
          order_seq: 0,
        });
      }
    }
  }, [open, workCode, parentWorkCodeId, form]);

  const onSubmit = (values: FormValues) => {
    if (isEdit && workCode) {
      updateWorkCode({
        work_code_id: workCode.work_code_id,
        work_code: values.work_code,
        work_code_name: values.work_code_name,
        parent_work_code_id: values.parent_work_code_id,
        order_seq: values.order_seq,
      }, {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess?.();
        }
      });
    } else {
      createWorkCode({
        work_code: values.work_code,
        work_code_name: values.work_code_name,
        code_type: 'OPTION',
        parent_work_code_id: values.parent_work_code_id,
        order_seq: values.order_seq,
      }, {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess?.();
        }
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-[40rem]:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('codeEdit') : t('codeCreate')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="work_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('code')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('codePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="work_code_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('codeName')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('codeNamePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="order_seq"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('orderSeq')}</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? tc('saving') : tc('save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export { WorkCodeEditDialog };
