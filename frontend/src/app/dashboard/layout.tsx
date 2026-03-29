import type { ReactNode } from 'react';
import { DashboardRouteShell } from './DashboardRouteShell';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <DashboardRouteShell>{children}</DashboardRouteShell>;
}
