import { AgreementsTabs } from '@/components/agreements/agreements-tabs';

export default function ContractsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AgreementsTabs group="documents" />
      {children}
    </>
  );
}
