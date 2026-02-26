'use client';
import { useAuthStore } from '@/store/authStore';
import { Permission, ROLE_PERMISSIONS } from '@/types/user';

export function usePermissions() {
    const user = useAuthStore((s) => s.user);

    const can = (permission: Permission): boolean => {
        if (!user) return false;
        return ROLE_PERMISSIONS[user.role].includes(permission);
    };

    const canAny = (...permissions: Permission[]): boolean =>
        permissions.some((p) => can(p));

    const canAll = (...permissions: Permission[]): boolean =>
        permissions.every((p) => can(p));

    return { can, canAny, canAll, role: user?.role ?? null };
}
