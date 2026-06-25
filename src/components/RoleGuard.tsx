'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
  redirectTo?: string;
}

const ROLE_REDIRECTS: Record<string, string> = {
  admin: '/dashboard/admin',
  photographer: '/dashboard/fotografo',
  client: '/dashboard/cliente',
};

export default function RoleGuard({ allowedRoles, children, redirectTo }: RoleGuardProps) {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter();
  const [showChildren, setShowChildren] = useState(false);
  const allowedRolesRef = useRef(allowedRoles);
  const processedRef = useRef(false);

  // Keep ref in sync with props
  allowedRolesRef.current = allowedRoles;

  useEffect(() => {
    if (isLoading) return;

    // Already processed — skip
    if (processedRef.current) return;

    // Not logged in → redirect to login
    if (!user) {
      router.replace('/login');
      return;
    }

    // Profile not loaded yet — wait for next render
    if (!profile) return;

    // Mark as processed to prevent re-runs
    processedRef.current = true;

    // Role mismatch → redirect to correct dashboard
    if (!allowedRolesRef.current.includes(profile.role)) {
      const target = redirectTo || ROLE_REDIRECTS[profile.role] || '/';
      router.replace(target);
      return;
    }

    // Authorized
    setShowChildren(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile, isLoading, router]);

  // Reset processed flag when auth state changes (e.g., after login/logout)
  useEffect(() => {
    processedRef.current = false;
  }, [user?.id]);

  if (isLoading || !showChildren) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
