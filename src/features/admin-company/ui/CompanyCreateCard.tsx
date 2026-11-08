import { Button } from '@/shared/ui/shadcn/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/shadcn/card';
import { CompanyFormDialog } from '@/features/admin-company/ui/CompanyFormDialog';
import { PostCompanyReq } from '@/entities/company';
import { Building2, Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface CompanyCreateCardProps {
  onCompanyCreate: (companyData: PostCompanyReq) => void;
}

const CompanyCreateCard = ({ onCompanyCreate }: CompanyCreateCardProps) => {
  const { t } = useTranslation('admin');
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  const handleSaveCompany = (formData: PostCompanyReq | { companyId: string; data: any }): void => {
    // Since this is a create card, we assume the data is PostCompanyReq
    onCompanyCreate(formData as PostCompanyReq);
    setIsDialogOpen(false);
  };

  const handleDialogOpenChange = (open: boolean): void => {
    setIsDialogOpen(open);
  };

  return (
    <Card className='w-full max-w-[28rem] shadow-lg'>
      <CardHeader className='text-center'>
        <CardTitle className='flex items-center justify-center space-x-2'>
          <Building2 className='text-blue-600' />
          <span>{t('company.addCardTitle')}</span>
        </CardTitle>
        <CardDescription>{t('company.addCardDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          className='w-full'
          size='lg'
          onClick={() => setIsDialogOpen(true)}
        >
          <Plus className='mr-2' />
          {t('company.addBtn')}
        </Button>
        <CompanyFormDialog
          isOpen={isDialogOpen}
          onOpenChange={handleDialogOpenChange}
          onSave={handleSaveCompany}
          initialData={{}}
        />
      </CardContent>
    </Card>
  )
}

export { CompanyCreateCard }
