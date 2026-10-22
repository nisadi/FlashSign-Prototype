import { AgreementsTabs } from '@/components/agreements/agreements-tabs';

export default function SignaturesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AgreementsTabs group="inbox" />
      {children}
    </>
  );
}
