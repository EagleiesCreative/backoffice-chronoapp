import { auth, currentUser } from '@clerk/nextjs/server';
import { supabaseAdmin } from './supabase';

// Whitelisted email domains for admin access
const ADMIN_DOMAINS = ['eagleies.com', 'chronosnap.com'];

export async function validateAdminAccess(): Promise<boolean> {
    const { userId } = await auth();
    if (!userId) return false;

    const user = await currentUser();
    if (!user?.primaryEmailAddress?.emailAddress) return false;

    const email = user.primaryEmailAddress.emailAddress;
    const domain = email.split('@')[1];

    return ADMIN_DOMAINS.includes(domain);
}

export async function getAdminUser() {
    const { userId } = await auth();
    if (!userId) return null;

    const user = await currentUser();
    if (!user) return null;

    return {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress || null,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || null,
        imageUrl: user.imageUrl
    };
}

// Audit log for admin actions
export async function logAdminAction(
    action: string,
    targetType: string,
    targetId: string,
    details?: Record<string, unknown>
) {
    const admin = await getAdminUser();
    if (!admin) return;

    try {
        await supabaseAdmin.from('admin_audit_log').insert({
            admin_id: admin.id,
            admin_email: admin.email,
            action,
            target_type: targetType,
            target_id: targetId,
            details,
            created_at: new Date().toISOString()
        });
    } catch (error) {
        // Log but don't fail the operation if audit logging fails
        console.error('Failed to log admin action:', error);
    }
}

// Format currency (IDR)
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Format date
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
        ...options
    }).format(new Date(date));
}

// Mask sensitive data (like bank account numbers)
export function maskString(value: string, visibleChars: number = 4): string {
    if (value.length <= visibleChars) return value;
    return '*'.repeat(value.length - visibleChars) + value.slice(-visibleChars);
}
