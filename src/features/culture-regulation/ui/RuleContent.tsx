import { RuleAttire } from '@/features/culture-regulation/ui/RuleAttire';
import { RuleCulture } from '@/features/culture-regulation/ui/RuleCulture';
import { RuleEducation } from '@/features/culture-regulation/ui/RuleEducation';
import { RuleHeader } from '@/features/culture-regulation/ui/RuleHeader';
import { RuleVacation } from '@/features/culture-regulation/ui/RuleVacation';

const RuleContent = () => {
  return (
    <div className='container mx-auto py-12 px-4 min-[48rem]:px-0 max-w-4xl'>
      <RuleHeader />
      <RuleVacation />
      <RuleAttire />
      <RuleEducation />
      <RuleCulture />
    </div>
  );
};

export { RuleContent };
