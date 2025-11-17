'use client';

import TagManager from 'react-gtm-module';
import Navbar from '@/app/components/principal/navbar';
import Footer from '@/app/components/principal/footer';
import { TimeZoneProvider } from '@/app/lib/time-zone-context';
import { AuthChecker } from '@/app/lib/auth-tracker';
import { ShoppingProvider } from '@/app/lib/shopping-context';
import { ThemeProvider } from '@/app/lib/theme-context';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Spinner from '@/app/components/principal/spinner';

export default function RootLayoutClient({ children }) {
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tagManagerArgs = useMemo(
    () => ({
      gtmId: process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID,
    }),
    []
  );

  useEffect(() => {
    TagManager.initialize(tagManagerArgs);
  }, [tagManagerArgs]);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => setInitialLoad(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (initialLoad || loading) {
    return (
      <div className="flex flex-col h-screen w-full justify-center items-center bg-[rgb(var(--color-card))] transition-colors duration-500">
        <Spinner />
      </div>
    );
  }

  return (
    <ThemeProvider>
      <TimeZoneProvider>
        <AuthChecker>
          <ShoppingProvider>
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-grow z-0">{children}</main>
              <Footer />
            </div>
          </ShoppingProvider>
        </AuthChecker>
      </TimeZoneProvider>
    </ThemeProvider>
  );
}
