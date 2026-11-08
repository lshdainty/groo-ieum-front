import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/shadcn/tabs";
import { ProtectedPage } from "@/shared/ui/require-permission/ProtectedPage";
import { RoleManagementPanel } from "@/features/admin-authority/ui/RoleManagementPanel";
import { UserManagementPanel } from "@/features/admin-authority/ui/UserManagementPanel";
import { Shield, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

const Authority = () => {
  const { t } = useTranslation('admin');

  return (
    <ProtectedPage permission="ROLE:MANAGE">
      <div className="h-full flex flex-col p-4 min-[40rem]:p-6 md:p-8 gap-6 overflow-hidden">
        <div className="flex items-center gap-2 flex-shrink-0">
          <Shield className="w-8 h-8" />
          <h1 className="text-3xl font-bold">{t('authority.title')}</h1>
        </div>

        <Tabs defaultValue="roles" className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="roles" className="flex-1 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                {t('authority.roles')}
              </TabsTrigger>
              <TabsTrigger value="users" className="flex-1 flex items-center gap-2">
                <Users className="w-4 h-4" />
                {t('authority.users')}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="roles" className="flex-1 mt-0 min-h-0">
            <RoleManagementPanel />
          </TabsContent>

          <TabsContent value="users" className="flex-1 mt-0 min-h-0">
            <UserManagementPanel />
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedPage>
  );
};

export { Authority };
