import { redirect } from 'next/navigation';

export default function AdminHealthRedirectPage() {
  redirect('/admin/configuracion?tab=health');
}
