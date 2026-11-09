import PermissionGuard from '@/shared/ui/require-permission/PermissionGuard';
import { Button } from '@/shared/ui/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/card';
import { toast } from '@/shared/ui/shadcn/sonner';
import {
  GetYearDuesResp,
  useDeleteDuesMutation,
  usePostDuesMutation,
  usePutDuesMutation,
} from '@/entities/dues'
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DuesTableContent, EditableDuesData } from '@/features/culture-dues/ui/DuesTableContent';
import { ConfirmDialog, useConfirmTarget } from '@/shared/ui/confirm';
import { claimFailure } from '@/shared/api/failure'

interface DuesTableProps {
  yearDues?: GetYearDuesResp[];
}

const DuesTable = ({ yearDues = [] }: DuesTableProps) => {
  const { t } = useTranslation('culture');
  const { t: tc } = useTranslation('common');
  const { mutate: postDues } = usePostDuesMutation();
  const { mutate: putDues } = usePutDuesMutation();
  const { mutateAsync: deleteDues } = useDeleteDuesMutation();
  const deleteConfirm = useConfirmTarget<EditableDuesData>();
  const [tableData, setTableData] = useState<EditableDuesData[]>([]);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  useEffect(() => {
    if (yearDues) {
      const formattedDues = yearDues.map((dues) => ({
        ...dues,
        id: dues.dues_id.toString(),
      }));
      setTableData(formattedDues);
    }
  }, [yearDues]);

  useEffect(() => {
    const totalPages = Math.ceil(tableData.length / rowsPerPage);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [tableData, currentPage, rowsPerPage]);

  const handleDelete = (id: string) => {
    const rowToDelete = tableData.find(row => row.id === id);
    if (!rowToDelete) return;

    if (rowToDelete.isNew) {
      // 새로 생성된 행 - 로컬에서만 삭제
      setTableData(tableData.filter((dues) => dues.id !== id));
    } else {
      // 기존 행 - 확인한 뒤 DELETE API 호출
      deleteConfirm.ask(rowToDelete);
    }
  };

  // 실패하면 던진다 — 확인창이 닫히고 실패 알림이 뜬다
  const performDelete = async (row: EditableDuesData) => {
    await deleteDues(row.dues_id);
    setTableData((prev) => prev.filter((dues) => dues.id !== row.id));
  };

  const handleCopy = (row: EditableDuesData) => {
    const tempId = `new_${Date.now()}`;
    const newRow: EditableDuesData = {
      ...row,
      id: tempId,
      dues_id: 0,
      isNew: true,
      tempId: tempId,
    };
    const newTableData = [newRow, ...tableData];
    setTableData(newTableData);
    setEditingRow(tempId);
    setCurrentPage(1);
  };

  const handleAdd = () => {
    const tempId = `new_${Date.now()}`;
    const newRow: EditableDuesData = {
      id: tempId,
      dues_id: 0,
      dues_date: dayjs().format('YYYY-MM-DD'),
      dues_user_name: '',
      dues_type: 'OPERATION',
      dues_detail: '',
      dues_amount: 0,
      dues_calc: 'PLUS',
      total_dues: 0,
      isNew: true,
      tempId: tempId,
    };

    const newTableData = [newRow, ...tableData];
    setTableData(newTableData);
    setEditingRow(tempId);
    setCurrentPage(1);
  };

  const handleEdit = (id: string) => {
    setEditingRow(id);
  };

  const handleSaveRow = (id: string) => {
    const rowToSave = tableData.find(row => row.id === id);
    if (!rowToSave) return;

    if (rowToSave.isNew) {
      // 새로 생성된 행 - POST 호출
      const { isNew, tempId, id: rowId, dues_id, total_dues, ...duesData } = rowToSave;
      postDues(duesData, {
        onSuccess: () => {
          setEditingRow(null);
        },
        onError: (error) => {
          console.error('Dues create failed:', error);
          claimFailure(error);
          toast.error(tc('saveFailed'));
        }
      });
    } else {
      // 기존 행 - PUT 호출
      const { id: rowId, total_dues, ...duesData } = rowToSave;
      putDues(duesData, {
        onSuccess: () => {
          setEditingRow(null);
        },
        onError: (error) => {
          console.error('Dues update failed:', error);
          claimFailure(error);
          toast.error(tc('saveFailed'));
        }
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, id: string, field: keyof GetYearDuesResp) => {
    setTableData(tableData.map((row) => {
      if (row.id === id) {
        return { ...row, [field]: e.target.value };
      }
      return row;
    }));
  };

  const handleSelectChange = (value: string, id: string, field: keyof GetYearDuesResp) => {
    setTableData(tableData.map((row) => {
      if (row.id === id) {
        return { ...row, [field]: value };
      }
      return row;
    }));
  };

  const handleDateChange = (value: string | undefined, id: string) => {
    if (!value) return;
    const formattedDate = dayjs(value).format('YYYY-MM-DD');
    setTableData(tableData.map((row) => {
      if (row.id === id) {
        return { ...row, dues_date: formattedDate };
      }
      return row;
    }));
  };

  const duesRow = deleteConfirm.target;

  return (
    <>
    <Card className='flex-1'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle>{t('dues.transactionHistory')}</CardTitle>
          <PermissionGuard requiredPermission="DUES:MANAGE">
            <Button className='text-sm h-8' onClick={handleAdd}>{tc('add')}</Button>
          </PermissionGuard>
        </div>
      </CardHeader>
      <CardContent>
        <DuesTableContent
          data={tableData}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          rowsPerPage={rowsPerPage}
          editingRow={editingRow}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onCopy={handleCopy}
          onSaveRow={handleSaveRow}
          onInputChange={handleInputChange}
          onSelectChange={handleSelectChange}
          onDateChange={handleDateChange}
        />
      </CardContent>
    </Card>
    <ConfirmDialog
      open={deleteConfirm.open}
      onOpenChange={deleteConfirm.onOpenChange}
      title={t('dues.deleteTitle')}
      description={t('dues.deleteConfirm', {
        date: duesRow ? dayjs(duesRow.dues_date).format('YYYY-MM-DD') : '',
        content: duesRow?.dues_detail,
        amount: `${Math.abs(duesRow?.dues_amount ?? 0).toLocaleString('ko-KR')}원`,
      })}
      onConfirm={async () => {
        if (duesRow) await performDelete(duesRow);
      }}
    />
    </>
  );
};

export { DuesTable };