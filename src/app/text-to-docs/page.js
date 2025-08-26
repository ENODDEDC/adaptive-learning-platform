import { Suspense } from 'react';
import TextToDocsClient from '@/components/TextToDocsClient';
import Layout from '@/components/Layout';

export default function TextToDocsPage() {
  return (
    <Layout>
      <Suspense fallback={<div>Loading...</div>}>
        <TextToDocsClient />
      </Suspense>
    </Layout>
  );
}