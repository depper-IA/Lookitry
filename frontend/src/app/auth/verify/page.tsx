import { AuthVerifyClient } from './AuthVerifyClient';

export default function AuthVerifyPage({
  searchParams,
}: {
  searchParams?: { token?: string };
}) {
  return <AuthVerifyClient token={searchParams?.token ?? null} />;
}
