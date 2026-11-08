import { Card, CardContent } from '@/shared/ui/shadcn/card';
import { GetUsersResp } from '@/entities/user';
import { UserCompanyStatsItem, getUserCompanyStatsConfig } from './UserCompanyStatsItem';

interface UserCompanyCardProps {
  value: GetUsersResp[];
}

const UserCompanyCard = ({ value: users }: UserCompanyCardProps) => {
  const companyStats = getUserCompanyStatsConfig(users);

  return (
    <div className='grid gap-4 md:grid-cols-2 min-[64rem]:grid-cols-5'>
      {companyStats.map((stat) => (
        <Card key={stat.id}>
          <CardContent className='h-full'>
            <UserCompanyStatsItem {...stat} />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export { UserCompanyCard };
