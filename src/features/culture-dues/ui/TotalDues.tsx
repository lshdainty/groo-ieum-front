import { Card, CardContent } from '@/shared/ui/shadcn/card';
import { GetMonthBirthDuesResp, GetYearOperationDuesResp } from '@/entities/dues';
import { useTranslation } from 'react-i18next';
import { TotalDuesItem, getTotalDuesConfig } from '@/features/culture-dues/ui/TotalDuesItem';

interface TotalDuesProps {
  totalDues?: GetYearOperationDuesResp;
  birthDues?: GetMonthBirthDuesResp;
}

const TotalDues = ({ totalDues, birthDues }: TotalDuesProps) => {
  const { t } = useTranslation('culture');
  const duesConfig = getTotalDuesConfig(totalDues, birthDues, t);

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 min-[64rem]:grid-cols-4 gap-6'>
      {duesConfig.map((item) => (
        <Card key={item.id} className='relative overflow-hidden'>
          <CardContent className='h-full'>
            <TotalDuesItem {...item} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export { TotalDues };