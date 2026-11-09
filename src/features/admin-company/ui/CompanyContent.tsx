import QueryAsyncBoundary from '@/shared/ui/async-boundary/QueryAsyncBoundary';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/shared/ui/shadcn/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/shadcn/tabs';
import { CompanyContentSkeleton } from '@/features/admin-company/ui/CompanyContentSkeleton';
import { CompanyEmpty } from '@/features/admin-company/ui/CompanyEmpty';
import { CompanyFormDialog } from '@/features/admin-company/ui/CompanyFormDialog';
import { DepartmentChartPanel } from '@/features/admin-company/ui/DepartmentChartPanel';
import { DepartmentTreePanel } from '@/features/admin-company/ui/DepartmentTreePanel';
import { useCompanyContext } from '@/features/admin-company/model/CompanyContext';
import { useCompanyQuery, useCompanyWithDepartmentsQuery, usePostCompanyMutation, usePutCompanyMutation } from '@/entities/company';
import { useDeleteDepartmentMutation, usePostDepartmentMutation, usePutDepartmentMutation } from '@/entities/department';
import { useIsMobile } from '@/shared/hooks/useIsMobile'
import { ConfirmDialog, useConfirmTarget } from '@/shared/ui/confirm';
import { type GetCompanyResp, type PostCompanyReq, type PutCompanyReq } from '@/entities/company';
import { type PostDepartmentReq, type PutDepartmentReq } from '@/entities/department';
import { type GetCompanyWithDepartment } from '@/entities/company';
import { Building2, Pencil } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

interface CompanyContentInnerProps {
  company: GetCompanyResp;
}

const CompanyContentInner = ({ company }: CompanyContentInnerProps) => {
  const { t } = useTranslation('admin');
  const isMobile = useIsMobile();
  const { selectedDept, setSelectedDept, isCompanyEditDialogOpen, setIsCompanyEditDialogOpen } = useCompanyContext();

  const { data: companyWithDepartments } = useCompanyWithDepartmentsQuery(company.company_id);
  const { mutate: createCompany } = usePostCompanyMutation();
  const { mutate: updateCompany } = usePutCompanyMutation();
  const { mutate: createDepartment } = usePostDepartmentMutation();
  const { mutate: updateDepartment } = usePutDepartmentMutation();
  const { mutateAsync: deleteDepartment } = useDeleteDepartmentMutation();
  const deleteConfirm = useConfirmTarget<GetCompanyWithDepartment>();

  const departments = useMemo(() => {
    return companyWithDepartments?.departments || [];
  }, [companyWithDepartments]);

  const handleCompanySave = (formData: PostCompanyReq | { companyId: string; data: PutCompanyReq }) => {
    if ('companyId' in formData) {
      updateCompany(formData, {
        onSuccess: () => {
          setIsCompanyEditDialogOpen(false);
        }
      });
    } else {
      createCompany(formData);
    }
  };

  const handleDeptUpdate = (formData: PostDepartmentReq | { departmentId: number; data: PutDepartmentReq }) => {
    if ('departmentId' in formData) {
      updateDepartment(formData);
    } else {
      const createData: PostDepartmentReq = {
        ...formData,
        company_id: company.company_id
      };
      createDepartment(createData);
    }
  };

  // 부서 지우기는 여기서 한 번 더 묻는다 — 트리의 🗑 가 어디서 오든 같은 확인창이다
  const handleDeptDelete = (deptId: number) => {
    const findDept = (list: GetCompanyWithDepartment[]): GetCompanyWithDepartment | null => {
      for (const dept of list) {
        if (dept.department_id === deptId) return dept;
        const found = findDept(dept.children ?? []);
        if (found) return found;
      }
      return null;
    };
    const dept = findDept(departments);
    if (dept) deleteConfirm.ask(dept);
  };

  return (
    <>
    <div className='h-full w-full'>
      <div className='h-full flex flex-col p-4 min-[40rem]:p-6 min-[48rem]:p-8 gap-6 overflow-hidden'>
        <div className='flex items-center gap-2 shrink-0'>
          <Building2 />
          <h1 className='text-3xl font-bold'>{company.company_name}</h1>
          <div
            onClick={() => setIsCompanyEditDialogOpen(true)}
            className='cursor-pointer p-1 rounded hover:bg-accent transition-colors'
          >
            <Pencil className='h-4 w-4' />
          </div>
        </div>

        <CompanyFormDialog
          isOpen={isCompanyEditDialogOpen}
          onOpenChange={setIsCompanyEditDialogOpen}
          onSave={handleCompanySave}
          initialData={{
            company_id: company.company_id,
            company_name: company.company_name,
            company_desc: company.company_desc
          }}
          mode='edit'
        />

        {isMobile ? (
          <Tabs defaultValue="dept-list" className="flex-1 min-h-0 flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="dept-list">{t('department.title')}</TabsTrigger>
              <TabsTrigger value="org-chart">{t('department.chart')}</TabsTrigger>
            </TabsList>
            <TabsContent value="dept-list" className="flex-1 min-h-0 mt-2 border rounded-lg overflow-hidden">
              <DepartmentTreePanel
                departments={departments}
                selectedDept={selectedDept}
                onDeptSelect={setSelectedDept}
                onDeptUpdate={handleDeptUpdate}
                onDeptDelete={handleDeptDelete}
                companyId={company.company_id}
              />
            </TabsContent>
            <TabsContent value="org-chart" className="flex-1 min-h-0 mt-2 border rounded-lg overflow-hidden">
              <DepartmentChartPanel
                departments={departments}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <ResizablePanelGroup direction='horizontal' className='flex-1 min-h-0 rounded-lg border'>
            <ResizablePanel
              defaultSize={25}
              minSize={25}
              style={{ overflow: 'hidden' }}
            >
              <DepartmentTreePanel
                departments={departments}
                selectedDept={selectedDept}
                onDeptSelect={setSelectedDept}
                onDeptUpdate={handleDeptUpdate}
                onDeptDelete={handleDeptDelete}
                companyId={company.company_id}
              />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel
              defaultSize={75}
              style={{ overflow: 'hidden' }}
            >
              <DepartmentChartPanel
                departments={departments}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
    </div>
    <ConfirmDialog
      open={deleteConfirm.open}
      onOpenChange={deleteConfirm.onOpenChange}
      title={t('department.deleteTitle')}
      description={t('department.deleteConfirm', { name: deleteConfirm.target?.department_name_kr })}
      onConfirm={async () => {
        if (deleteConfirm.target) await deleteDepartment(deleteConfirm.target.department_id);
      }}
    />
    </>
  );
};

const CompanyContent = () => {
  const { data: company, isLoading, error } = useCompanyQuery();
  const { mutate: createCompany } = usePostCompanyMutation();

  const handleCompanyCreate = (companyFormData: PostCompanyReq) => {
    createCompany(companyFormData);
  };

  return (
    <QueryAsyncBoundary
      queryState={{ isLoading, error, data: company }}
      loadingComponent={<CompanyContentSkeleton />}
      emptyComponent={<CompanyEmpty onCompanyCreate={handleCompanyCreate} />}
      isEmpty={(data) => !data}
    >
      <CompanyContentInner company={company!} />
    </QueryAsyncBoundary>
  );
};

export { CompanyContent };
