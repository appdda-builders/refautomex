'use client';
import "./globals.css";
import TagManager from 'react-gtm-module';
import Navbar from '@/app/components/principal/navbar';
import Footer from '@/app/components/principal/footer';
import { TimeZoneProvider } from '@/app/lib/time-zone-context';
import { AuthChecker } from '@/app/lib/auth-tracker';
import { ShoppingProvider } from '@/app/lib/shopping-context';
import { ThemeProvider } from '@/app/lib/theme-context';
import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Spinner from '@/app/components/principal/spinner';

export default function RootLayout({ children }) {
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tagManagerArgs = {
    gtmId: process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID,
  };

  useEffect(() => {
    TagManager.initialize(tagManagerArgs);
  }, []);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => setInitialLoad(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const renderContent = () => {
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
  };

  return (
    <html lang="es" data-theme="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased transition-colors duration-500 ease-in-out">
        {renderContent()}
      </body>
    </html>
  );
}
