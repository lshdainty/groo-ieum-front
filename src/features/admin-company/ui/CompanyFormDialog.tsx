import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { Input } from '@/shared/ui/shadcn/input'
import { Button } from '@/shared/ui/shadcn/button'
import { Textarea } from '@/shared/ui/shadcn/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/shadcn/dialog'
import { Field, FieldLabel, FieldError } from '@/shared/ui/shadcn/field'
import { Spinner } from '@/shared/ui/shadcn/spinner'
import { PostCompanyReq, PutCompanyReq } from '@/entities/company'

type CompanyFormValues = z.infer<ReturnType<typeof createCompanyFormSchema>>

const createCompanyFormSchema = (t: (key: string) => string) => z.object({
  company_id: z.string().min(1, { message: t('company.companyIdRequired') }),
  company_name: z.string().min(1, { message: t('company.companyNameRequired') }),
  company_desc: z.string().optional(),
})

interface CompanyFormDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSave: (formData: PostCompanyReq | { companyId: string; data: PutCompanyReq }) => void
  initialData?: Partial<PostCompanyReq>
  mode?: 'create' | 'edit'
}

const CompanyFormDialog = ({
  isOpen,
  onOpenChange,
  onSave,
  initialData = {},
  mode = 'create'
}: CompanyFormDialogProps) => {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(createCompanyFormSchema(t)),
    defaultValues: {
      company_id: '',
      company_name: '',
      company_desc: '',
    },
    mode: 'onChange',
  })

  useEffect(() => {
    if (isOpen && initialData) {
      form.reset({
        company_id: initialData.company_id || '',
        company_name: initialData.company_name || '',
        company_desc: initialData.company_desc || '',
      })
    }
  }, [isOpen, form, initialData])

  const onSubmit = (values: CompanyFormValues): void => {
    if (mode === 'edit') {
      onSave({
        companyId: values.company_id,
        data: {
          company_name: values.company_name,
          company_desc: values.company_desc || '',
        }
      })
    } else {
      onSave({
        company_id: values.company_id,
        company_name: values.company_name,
        company_desc: values.company_desc || '',
      })
    }
  }

  const handleOpenChange = (open: boolean): void => {
    if (!open) {
      form.reset()
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className='max-w-[28rem]'>
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? t('company.editTitle') : t('company.createTitle')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
          <Controller
            control={form.control}
            name='company_id'
            render={({ field, fieldState }) => (
              <Field data-invalid={!!fieldState.error}>
                <FieldLabel>
                  {t('company.companyId')}
                  <span className='text-destructive ml-0.5'>*</span>
                </FieldLabel>
                <Input
                  placeholder={t('company.companyIdPlaceholder')}
                  {...field}
                  disabled={mode === 'edit'}
                />
                <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name='company_name'
            render={({ field, fieldState }) => (
              <Field data-invalid={!!fieldState.error}>
                <FieldLabel>
                  {t('company.companyName')}
                  <span className='text-destructive ml-0.5'>*</span>
                </FieldLabel>
                <Input placeholder={t('company.companyNamePlaceholder')} {...field} />
                <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name='company_desc'
            render={({ field, fieldState }) => (
              <Field data-invalid={!!fieldState.error}>
                <FieldLabel>{t('company.companyIntro')}</FieldLabel>
                <Textarea
                  placeholder={t('company.companyIntroPlaceholder')}
                  rows={4}
                  {...field}
                />
                <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
              </Field>
            )}
          />
          <div className='flex justify-end space-x-2 pt-4'>
            <Button
              type='button'
              variant='secondary'
              onClick={() => handleOpenChange(false)}
            >
              {tc('cancel')}
            </Button>
            <Button
              type='submit'
              disabled={!form.formState.isValid || form.formState.isSubmitting}
            >
              {form.formState.isSubmitting && <Spinner />}
              {form.formState.isSubmitting ? tc('saving') : tc('save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { CompanyFormDialog }
