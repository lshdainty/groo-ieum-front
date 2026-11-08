import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/shadcn/dialog'
import { Button } from '@/shared/ui/shadcn/button'
import { Input } from '@/shared/ui/shadcn/input'
import { Textarea } from '@/shared/ui/shadcn/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/ui/shadcn/form'
import { usePostVacationPlanMutation, usePutVacationPlanMutation } from '@/entities/vacation-plan'
import { type VacationPlanResp } from '@/entities/vacation-plan'

interface VacationPlanFormDialogProps {
  isEditing?: boolean
  plan?: VacationPlanResp
  trigger: React.ReactNode
}

const VacationPlanFormDialog = ({
  isEditing = false,
  plan,
  trigger
}: VacationPlanFormDialogProps) => {
  const { t } = useTranslation('vacation')
  const { t: tc } = useTranslation('common')
  const [open, setOpen] = useState(false)

  const createPlanMutation = usePostVacationPlanMutation()
  const updatePlanMutation = usePutVacationPlanMutation()

  const formSchema = z.object({
    code: isEditing
      ? z.string().optional()
      : z.string()
          .min(1, t('plan.codeRequired'))
          .regex(/^[A-Za-z0-9_]+$/, t('plan.codePattern')),
    name: z.string().min(1, t('plan.nameRequired')),
    desc: z.string().optional(),
  })

  type FormData = z.infer<typeof formSchema>

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: plan?.code || '',
      name: plan?.name || '',
      desc: plan?.desc || '',
    },
  })

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditing && plan) {
        await updatePlanMutation.mutateAsync({
          code: plan.code,
          data: {
            name: data.name,
            desc: data.desc || '',
          }
        })
      } else {
        await createPlanMutation.mutateAsync({
          code: data.code!,
          name: data.name,
          desc: data.desc || '',
        })
      }
      setOpen(false)
      form.reset()
    } catch (error) {
      console.error('Failed to save plan:', error)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      form.reset({
        code: plan?.code || '',
        name: plan?.name || '',
        desc: plan?.desc || '',
      })
    }
  }

  const isPending = createPlanMutation.isPending || updatePlanMutation.isPending

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="min-[40rem]:max-w-[32rem]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('plan.editTitle') : t('plan.addTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('plan.managementDesc')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {!isEditing && (
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('plan.code')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('plan.codePlaceholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('plan.name')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('plan.namePlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="desc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('plan.desc')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('plan.descPlaceholder')}
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                {tc('cancel')}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? tc('saving') : tc('save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export { VacationPlanFormDialog }
