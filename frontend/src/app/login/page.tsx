import LoginForm from '@/components/auth/LoginForm';
import AuthGuard from '@/components/auth/AuthGuard';
import { PublicTopbar } from '@/components/layout/PublicTopbar';

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { redirect?: string };
}) {
  const redirectTo =
    searchParams?.redirect && searchParams.redirect.startsWith('/')
      ? searchParams.redirect
      : '/dashboard';

  return (
    <AuthGuard redirectTo="/dashboard">
      <PublicTopbar />
      <LoginForm redirectTo={redirectTo} />
    </AuthGuard>
  );
}
