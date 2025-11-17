import { Suspense } from 'react';
import Spinner from '@/app/components/principal/spinner';
import CalidadClient from './calidad-client';

export default function Services() {
  return (
    <Suspense fallback={<Spinner />}>
      <CalidadClient />
    </Suspense>
  );
}
