import QueryAsyncBoundary from '@/shared/ui/async-boundary/QueryAsyncBoundary';
import { toast } from '@/shared/ui/shadcn/sonner';
import { useUser } from '@/entities/session';
import { ExcelImportDialog } from '@/features/work-report/ui/ExcelImportDialog';
import { ReportDeleteDialog } from '@/features/work-report/ui/ReportDeleteDialog';
import { ReportFilter } from '@/features/work-report/ui/ReportFilter';
import { ReportHeader } from '@/features/work-report/ui/ReportHeader';
import { ReportSkeleton } from '@/features/work-report/ui/ReportSkeleton';
import { ReportTable } from '@/features/work-report/ui/ReportTable';
import { UnregisteredDownloadDialog } from '@/features/work-report/ui/UnregisteredDownloadDialog';
import { useReportContext } from '@/features/work-report/model/ReportContext';
import { WorkHistory } from '@/features/work-report/model/types';
import { isExcelPeriodValid } from '@/features/work-report/model/excelPeriod';
import { useUsersQuery } from '@/entities/user';
import {
  WorkHistoryResp,
  WorkHistorySearchCondition,
  useBulkCreateWorkHistoriesMutation,
  useDeleteWorkHistoryMutation,
  usePostCreateWorkHistoryMutation,
  usePutUpdateWorkHistoryMutation,
  useWorkDivisionQuery,
  useWorkGroupsWithPartsQuery,
  useWorkHistoriesQuery,
  useWorkHistoryExcelDownloadMutation,
} from '@/entities/work'
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { claimFailure } from '@/shared/api/failure'

const ReportContent = () => {
  const { t } = useTranslation('work');
  const { loginUser } = useUser();
  const {
    activeFilters,
    selectedRows,
    setSelectedRows,
    setEditingRow,
    setEditData,
    editData,
    isExcelImportOpen,
    setIsExcelImportOpen,
  } = useReportContext();

  // Data Fetching
  const { data: workGroupsWithParts, isLoading: isWorkGroupsLoading, error: workGroupsError } = useWorkGroupsWithPartsQuery();
  const { data: workDivision, isLoading: isWorkDivisionLoading, error: workDivisionError } = useWorkDivisionQuery();
  const { data: users, isLoading: isUsersLoading, error: usersError } = useUsersQuery();

  const searchCondition: WorkHistorySearchCondition = {
    startDate: activeFilters.startDate ? dayjs(activeFilters.startDate).format('YYYY-MM-DD') : undefined,
    endDate: activeFilters.endDate ? dayjs(activeFilters.endDate).format('YYYY-MM-DD') : undefined,
    userId: activeFilters.filterName && activeFilters.filterName !== 'all' ? activeFilters.filterName : undefined,
    groupSeq: activeFilters.selectedWorkGroup !== 'all'
      ? workGroupsWithParts?.find(g => g.work_code === activeFilters.selectedWorkGroup)?.work_code_id
      : undefined,
    partSeq: activeFilters.selectedWorkPart !== 'all'
      ? workGroupsWithParts?.flatMap(g => g.labels.flatMap(l => l.parts)).find(p => p.work_code === activeFilters.selectedWorkPart)?.work_code_id
      : undefined,
    divisionSeq: activeFilters.selectedWorkDivision !== 'all'
      ? workDivision?.find(d => d.work_code === activeFilters.selectedWorkDivision)?.work_code_id
      : undefined,
    sortType: activeFilters.sortOrder === 'latest' ? 'LATEST' : 'OLDEST',
  };

  const { data: workHistoriesData, isLoading: isWorkHistoriesLoading, error: workHistoriesError, refetch: refetchWorkHistories } = useWorkHistoriesQuery(searchCondition);

  // Mutations
  const createWorkHistory = usePostCreateWorkHistoryMutation();
  const updateWorkHistory = usePutUpdateWorkHistoryMutation();
  const deleteWorkHistory = useDeleteWorkHistoryMutation();
  const createWorkHistoryBatch = useBulkCreateWorkHistoriesMutation();
  const downloadWorkHistoryExcel = useWorkHistoryExcelDownloadMutation();

  // Local State for Table Data (converted from API response)
  const [workHistories, setWorkHistories] = useState<WorkHistory[]>([]);

  // Unregistered Hours Download Dialog State
  const [isUnregisteredDialogOpen, setIsUnregisteredDialogOpen] = useState(false);

  // Delete Dialog State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WorkHistory | null>(null);

  useEffect(() => {
    if (workHistoriesData) {
      const convertedData: WorkHistory[] = workHistoriesData.map((item: WorkHistoryResp, index: number) => ({
        no: index + 1,
        work_history_id: item.work_history_id,
        date: item.work_date,
        manager_id: item.work_user_id,
        manager_name: item.work_user_name,
        work_group: item.work_group,
        work_part: item.work_part,
        work_division: item.work_class,
        hours: item.work_hour,
        content: item.work_content,
      }));
      setWorkHistories(convertedData);
    }
  }, [workHistoriesData]);

  // Handlers
  const handleAddRow = () => {
    const maxNo = workHistories.length > 0 ? Math.max(...workHistories.map((item) => item.no)) : 0;
    const newRow: WorkHistory = {
      no: maxNo + 1,
      work_history_id: undefined,
      date: dayjs().format('YYYY-MM-DD'),
      manager_id: loginUser?.user_id || '',
      manager_name: loginUser?.user_name || '',
      work_group: undefined,
      work_part: undefined,
      work_division: undefined,
      hours: 0,
      content: '',
    };
    setWorkHistories([newRow, ...workHistories]);
    setEditingRow(newRow.no);
    setEditData(newRow);
  };

  const handleEdit = (row: WorkHistory) => {
    setEditingRow(row.no);
    setEditData({ ...row });
  };

  const handleSave = async () => {
    if (!editData) return;

    const missingFields: string[] = [];
    if (!editData.date) missingFields.push(t('report.fieldDate'));
    if (!editData.work_group) missingFields.push(t('report.fieldWorkGroup'));
    if (!editData.work_part) missingFields.push(t('report.fieldWorkPart'));
    if (!editData.work_division) missingFields.push(t('report.fieldWorkDivision'));

    if (missingFields.length > 0) {
      toast.error(t('report.missingFields', { fields: missingFields.join(', ') }));
      return;
    }

    try {
      const isNew = !editData.work_history_id;

      if (isNew) {
        await createWorkHistory.mutateAsync({
          work_date: editData.date,
          work_user_id: editData.manager_id,
          work_group_code: editData.work_group!.work_code,
          work_part_code: editData.work_part!.work_code,
          work_class_code: editData.work_division!.work_code,
          work_hour: Number(editData.hours) || 0,
          work_content: editData.content,
        });
      } else {
        await updateWorkHistory.mutateAsync({
          work_history_id: editData.work_history_id!,
          work_date: editData.date,
          work_user_id: editData.manager_id,
          work_group_code: editData.work_group!.work_code,
          work_part_code: editData.work_part!.work_code,
          work_class_code: editData.work_division!.work_code,
          work_hour: Number(editData.hours) || 0,
          work_content: editData.content,
        });
      }

      await refetchWorkHistories();
      setEditingRow(null);
      setEditData(null);
    } catch (error) {
      console.error('Save failed:', error);
      claimFailure(error);
      toast.error(t('report.saveFailed'));
    }
  };

  const handleCancel = () => {
    if (editData && !editData.work_history_id) {
      setWorkHistories(workHistories.filter((item) => item.no !== editData.no));
    }
    setEditingRow(null);
    setEditData(null);
  };

  const handleDuplicate = async (row: WorkHistory) => {
    if (!row.work_group || !row.work_part || !row.work_division) {
      toast.error(t('report.invalidDuplicateData'));
      return;
    }

    const maxNo = workHistories.length > 0 ? Math.max(...workHistories.map((item) => item.no)) : 0;
    const newRow: WorkHistory = {
      ...row,
      no: maxNo + 1,
      work_history_id: undefined, // 새 항목으로 취급
      date: dayjs().format('YYYY-MM-DD'), // 오늘 날짜로 설정
      manager_id: loginUser?.user_id || row.manager_id,
    };

    setWorkHistories([newRow, ...workHistories]);
    setEditingRow(newRow.no);
    setEditData(newRow);
  };

  const handleDuplicateSelected = async () => {
    if (selectedRows.length === 0) return;

    const selectedWorkHistories = workHistories.filter((row) =>
      selectedRows.includes(row.no)
    );

    const invalidRows = selectedWorkHistories.filter(
      (row) => !row.work_group || !row.work_part || !row.work_division
    );

    if (invalidRows.length > 0) {
      toast.error(t('report.invalidSelectedData'));
      return;
    }

    try {
      const promises = selectedWorkHistories.map((row) =>
        createWorkHistory.mutateAsync({
          work_date: dayjs().format('YYYY-MM-DD'),
          work_user_id: loginUser?.user_id || row.manager_id,
          work_group_code: row.work_group!.work_code,
          work_part_code: row.work_part!.work_code,
          work_class_code: row.work_division!.work_code,
          work_hour: Number(row.hours) || 0,
          work_content: row.content,
        })
      );

      await Promise.all(promises);
      await refetchWorkHistories();
      setSelectedRows([]);
    } catch (error) {
      console.error('Duplicate failed:', error);
      claimFailure(error);
      toast.error(t('report.duplicateFailed'));
    }
  };

  const handleDeleteClick = (row: WorkHistory) => {
    if (!row.work_history_id) {
      // 저장되지 않은 새 row는 바로 삭제
      setWorkHistories(workHistories.filter((item) => item.no !== row.no));
      setSelectedRows(selectedRows.filter((rowNo) => rowNo !== row.no));
      return;
    }
    setDeleteTarget(row);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget?.work_history_id) return;

    try {
      await deleteWorkHistory.mutateAsync(deleteTarget.work_history_id);
      await refetchWorkHistories();
      setIsDeleteDialogOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error('Delete failed:', error);
      claimFailure(error);
      toast.error(t('report.deleteFailed'));
    }
  };

  // Excel Handlers
  const handleExcelImport = () => setIsExcelImportOpen(true);
  
  const handleBatchRegister = async (data: any[]) => {
    try {
      await createWorkHistoryBatch.mutateAsync({ work_histories: data });
      await refetchWorkHistories();
    } catch (error) {
      console.error('Batch register failed:', error);
      claimFailure(error);
      toast.error(t('report.batchRegisterFailed'));
    }
  };

  const handleExcelExport = async () => {
    if (!isExcelPeriodValid(searchCondition.startDate, searchCondition.endDate)) {
      toast.error(t('report.excelPeriodInvalid'));
      return;
    }
    try {
      const blob = await downloadWorkHistoryExcel.mutateAsync(searchCondition);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${t('report.fileNamePrefix')}_${dayjs().format('YYYYMMDD')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Excel download failed:', error);
      claimFailure(error);
      toast.error(t('report.excelDownloadFailed'));
    }
  };

  const handleDownloadTemplate = () => {};

  const handleDownloadUnregistered = () => {
    setIsUnregisteredDialogOpen(true);
  };

  const isLoading = isWorkGroupsLoading || isWorkDivisionLoading || isWorkHistoriesLoading || isUsersLoading;
  const error = workGroupsError || workDivisionError || workHistoriesError || usersError;

  return (
    <QueryAsyncBoundary
      queryState={{ isLoading, error, data: workHistoriesData }}
      loadingComponent={<ReportSkeleton />}
      errorComponent={
        <div className='p-4 min-[40rem]:p-6 min-[48rem]:p-8'>
          <div className='p-8 text-center text-red-600'>
            {t('report.dataLoadFailed')}
          </div>
        </div>
      }
    >
      <div className='p-4 min-[40rem]:p-6 min-[48rem]:p-8'>
        <ReportHeader
          handleExcelImport={handleExcelImport}
          handleExcelExport={handleExcelExport}
          handleDownloadTemplate={handleDownloadTemplate}
          handleDownloadUnregistered={handleDownloadUnregistered}
        />

        <ReportFilter
          workGroups={workGroupsWithParts || []}
          workDivision={workDivision || []}
          users={users || []}
        />

        <div className='mt-6'>
          <ReportTable
            workHistories={workHistories}
            isWorkHistoriesLoading={false}
            handleAddRow={handleAddRow}
            handleDuplicateSelected={handleDuplicateSelected}
            handleSave={handleSave}
            handleCancel={handleCancel}
            handleEdit={handleEdit}
            handleDelete={handleDeleteClick}
            handleDuplicate={handleDuplicate}
            workGroups={workGroupsWithParts || []}
            isWorkGroupsLoading={false}
            workDivision={workDivision}
            isWorkDivisionLoading={false}
            isSaving={createWorkHistory.isPending || updateWorkHistory.isPending}
          />
        </div>

        <ExcelImportDialog
          open={isExcelImportOpen}
          onOpenChange={setIsExcelImportOpen}
          workGroups={workGroupsWithParts || []}
          workDivision={workDivision || []}
          users={users || []}
          onRegister={handleBatchRegister}
          isRegistering={createWorkHistoryBatch.isPending}
        />

        <UnregisteredDownloadDialog
          open={isUnregisteredDialogOpen}
          onOpenChange={setIsUnregisteredDialogOpen}
        />

        <ReportDeleteDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          workHistory={deleteTarget}
          onConfirm={handleDeleteConfirm}
          isPending={deleteWorkHistory.isPending}
        />
      </div>
    </QueryAsyncBoundary>
  );
}

export { ReportContent }
