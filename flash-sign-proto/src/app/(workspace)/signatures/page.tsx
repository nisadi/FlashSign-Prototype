import { redirect } from 'next/navigation';

// The signature dashboard now lives on the Agreements home (/agreements);
// /signatures itself opens the first Inbox tab.
export default function SignaturesIndexPage() {
  redirect('/signatures/all');
}
