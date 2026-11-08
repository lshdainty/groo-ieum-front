import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/shadcn/tabs';
import { Briefcase } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { WorkCodeProvider } from '@/features/admin-work-code/model/WorkCodeContext';
import { WorkCodeList } from './WorkCodeList';
import { WorkDivisionList } from './WorkDivisionList';

const WorkCodeContent = () => {
  const { t } = useTranslation('work');

  return (
    <WorkCodeProvider>
      <div className='w-full'>
        <div className='flex flex-col p-4 min-[40rem]:p-6 md:p-8 gap-6'>
          <div className='flex items-center gap-2 shrink-0'>
            <Briefcase />
            <h1 className='text-3xl font-bold'>{t('codeManagement')}</h1>
          </div>

          <Tabs defaultValue="part" className="flex flex-col gap-2">
            <TabsList>
              <TabsTrigger value="part">{t('workPart')}</TabsTrigger>
              <TabsTrigger value="division">{t('workDivision')}</TabsTrigger>
            </TabsList>

            <TabsContent value="part" className="mt-0 border rounded-lg">
              <div className="p-4">
                <WorkCodeList />
              </div>
            </TabsContent>

            <TabsContent value="division" className="mt-0 border rounded-lg">
              <div className="p-4">
                <WorkDivisionList />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </WorkCodeProvider>
  );
};

export { WorkCodeContent };
