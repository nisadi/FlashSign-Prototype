import { redirect } from 'next/navigation';

// The documents overview now lives on the Agreements home (/agreements);
// /documents itself opens the first Documents tab.
export default function DocumentsIndexPage() {
  redirect('/documents/all');
}
