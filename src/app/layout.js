'use client';
import "./globals.css";
import TagManager from 'react-gtm-module';
import Navbar from '@/app/components/principal/navbar';
import Footer from '@/app/components/principal/footer';
import { TimeZoneProvider } from '@/app/lib/time-zone-context';
import { AuthChecker } from '@/app/lib/auth-tracker';
import { ShoppingProvider } from '@/app/lib/shopping-context';
import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Spinner from '@/app/components/principal/spinner';

export default function RootLayout({ children }) {
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tagManagerArgs = {
    gtmId: process.env.GOOGLE_TAG_MANAGER_ID,
  }

  useEffect(() => {
    TagManager.initialize(tagManagerArgs);
  }, []);

  // Handle route changes
  useEffect(() => {
    setLoading(true);

    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoad(false);
    }, 2000); // 2 seconds

    return () => clearTimeout(timer);
  }, []);

  const renderContent = () => {
    if (initialLoad || loading) {
      return (
        <div className='flex flex-col h-screen w-full my-auto justify-center items-center'>
          <div className='flex flex-col my-auto'>
            <Spinner />
          </div>
        </div>
      );
    } else {
      return (
        <TimeZoneProvider>
          <AuthChecker>
            <ShoppingProvider>
              <div className="flex flex-col min-h-screen">
                <main className="flex-grow z-0">
                  <Navbar />
                  {children}
                  <Footer />
                </main>
              </div>
            </ShoppingProvider>
          </AuthChecker>
        </TimeZoneProvider>
      );
    }
  };

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet"/>
        <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCg2k0O04ohb3jVIOjHUJTVvoCoM0nKi-Q&libraries=places&v=beta" async defer></script>
        <script src="https://www.google.com/recaptcha/enterprise.js?render=6LdtuLsqAAAAALEcc3m18wA_aQBBVDtCMadivlGV"></script>
      </head>
      <body className={`antialiased`}>
        {renderContent()}
      </body>
    </html>
  );
}