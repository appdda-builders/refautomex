'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useContext, useEffect, useMemo } from 'react';
import { AuthContext } from '@/app/lib/auth-tracker';

import LogIn from '@/app/components/productivity/joinus/log-in';
import Spinner from '@/app/components/principal/spinner';
import BackgroundStars from '@/app/components/principal/account/background-stars';
import ShiftModeButton from '@/app/components/principal/shiftmode-button';

export default function CalidadClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, authStatusChecked } = useContext(AuthContext);

  const lang = searchParams.get('lang') || 'es';
  const load = searchParams.get('load') || 'log-in';

  const component = useMemo(() => {
    switch (load) {
      case 'log-in':
        return <LogIn />;
      default:
        return <LogIn />;
    }
  }, [load]);

  useEffect(() => {
    if (authStatusChecked && isAuthenticated === true) {
      router.replace(`/productivity?load=${load}&lang=${lang}`);
    }
  }, [authStatusChecked, isAuthenticated, lang, load, router]);

  if (isAuthenticated === true) return <Spinner />;

  return (
    <section className="relative">
      <div className="absolute bottom-3 left-3 z-50">
        <ShiftModeButton />
      </div>

      <BackgroundStars>{component}</BackgroundStars>
    </section>
  );
}
