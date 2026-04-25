import AdminLoginPageClient from './page.client';
import Script from 'next/script';

export const dynamic = 'force-dynamic';

export default function AdminLoginPage() {
  return (
    <>
      {/* Google Identity Services — solo en páginas de auth */}
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      <AdminLoginPageClient />
    </>
  );
}
