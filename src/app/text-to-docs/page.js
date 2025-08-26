import { Suspense } from 'react';
import TextToDocsClient from '@/components/TextToDocsClient';

export default function TextToDocsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TextToDocsClient />
    </Suspense>
  );
}