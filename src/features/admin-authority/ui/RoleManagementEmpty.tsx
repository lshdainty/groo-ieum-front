import { RequirePermission } from "@/shared/ui/require-permission/RequirePermission";
import { Button } from "@/shared/ui/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/shadcn/dialog";
import { Field, FieldError, FieldLabel } from "@/shared/ui/shadcn/field";
import { Input } from "@/shared/ui/shadcn/input";
import { Spinner } from "@/shared/ui/shadcn/spinner";
import { Textarea } from "@/shared/ui/shadcn/textarea";
import { usePostRoleMutation, useRolesQuery } from '@/entities/role';
import { cn } from "@/shared/lib";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Shield } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

interface RoleManagementEmptyProps {
  className?: string;
}

const createFormSchema = (t: (key: string) => string) => z.object({
  role_code: z.string().min(1, t('authority.roleCodeRequired')),
  role_name: z.string().min(1, t('authority.roleNameRequired')),
  desc: z.string().optional(),
});

type RoleFormValues = z.infer<ReturnType<typeof createFormSchema>>;

const RoleManagementEmpty = ({ className }: RoleManagementEmptyProps) => {
  const { t } = useTranslation('admin');
  const { t: tc } = useTranslation('common');
  const [dialogOpen, setDialogOpen] = useState(false);
  const { refetch } = useRolesQuery();
  const { mutateAsync: createRole, isPending } = usePostRoleMutation();
  const formSchema = createFormSchema(t);

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role_code: '',
      role_name: '',
      desc: '',
    },
  });

  const handleOpenDialog = () => {
    form.reset();
    setDialogOpen(true);
  };

  const onSubmit = async (values: RoleFormValues) => {
    try {
      await createRole({
        role_code: values.role_code,
        role_name: values.role_name,
        desc: values.desc || '',
        permission_codes: [],
      });
      toast.success(t('authority.roleCreated'));
      setDialogOpen(false);
      refetch();
    } catch (error) {
      console.error("Failed to create role:", error);
      toast.error(t('authority.roleSaveFailed'));
    }
  };

  return (
    <>
      <div className={cn("flex flex-col items-center justify-center gap-4 text-center p-8", className)}>
        <div className="rounded-full bg-muted p-4">
          <Shield className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{t('authority.noRoles')}</h3>
          <p className="text-sm text-muted-foreground max-w-[24rem]">
            {t('authority.noRolesDesc')}
          </p>
        </div>
        <RequirePermission permission="ROLE:MANAGE">
          <Button onClick={handleOpenDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('authority.addRole')}
          </Button>
        </RequirePermission>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="min-[40rem]:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('authority.addRole')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="py-4 space-y-4">
              <Controller
                control={form.control}
                name="role_code"
                render={({ field, fieldState }) => (
                  <Field data-invalid={!!fieldState.error}>
                    <FieldLabel>
                      {t('authority.roleCode')}
                      <span className="text-destructive ml-0.5">*</span>
                    </FieldLabel>
                    <Input placeholder={t('authority.roleCodePlaceholder')} {...field} />
                    <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="role_name"
                render={({ field, fieldState }) => (
                  <Field data-invalid={!!fieldState.error}>
                    <FieldLabel>
                      {t('authority.roleName')}
                      <span className="text-destructive ml-0.5">*</span>
                    </FieldLabel>
                    <Input placeholder={t('authority.roleNamePlaceholder')} {...field} />
                    <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="desc"
                render={({ field, fieldState }) => (
                  <Field data-invalid={!!fieldState.error}>
                    <FieldLabel>{t('authority.roleDesc')}</FieldLabel>
                    <Textarea placeholder={t('authority.roleDescPlaceholder')} {...field} />
                    <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                  </Field>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                {tc('cancel')}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Spinner className="mr-2" />}
                {tc('save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export { RoleManagementEmpty };
