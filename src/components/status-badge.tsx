import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type StatusType =
    | 'active' | 'inactive'
    | 'online' | 'offline'
    | 'pending' | 'approved' | 'rejected' | 'completed' | 'failed'
    | 'PENDING' | 'PAID' | 'SETTLED' | 'EXPIRED' | 'FAILED'
    | 'basic' | 'pro'
    | 'cancelled' | 'expired' | 'past_due';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
    // General
    active: { label: 'Active', variant: 'default', className: 'bg-green-500/20 text-green-500 hover:bg-green-500/30' },
    inactive: { label: 'Inactive', variant: 'secondary', className: 'bg-gray-500/20 text-gray-400' },
    online: { label: 'Online', variant: 'default', className: 'bg-green-500/20 text-green-500' },
    offline: { label: 'Offline', variant: 'secondary', className: 'bg-red-500/20 text-red-500' },

    // Withdrawal status
    pending: { label: 'Pending', variant: 'secondary', className: 'bg-yellow-500/20 text-yellow-500' },
    approved: { label: 'Approved', variant: 'default', className: 'bg-blue-500/20 text-blue-500' },
    rejected: { label: 'Rejected', variant: 'destructive', className: 'bg-red-500/20 text-red-500' },
    completed: { label: 'Completed', variant: 'default', className: 'bg-green-500/20 text-green-500' },
    failed: { label: 'Failed', variant: 'destructive', className: 'bg-red-500/20 text-red-500' },

    // Payment status (uppercase)
    PENDING: { label: 'Pending', variant: 'secondary', className: 'bg-yellow-500/20 text-yellow-500' },
    PAID: { label: 'Paid', variant: 'default', className: 'bg-green-500/20 text-green-500' },
    SETTLED: { label: 'Settled', variant: 'default', className: 'bg-blue-500/20 text-blue-500' },
    EXPIRED: { label: 'Expired', variant: 'secondary', className: 'bg-gray-500/20 text-gray-400' },
    FAILED: { label: 'Failed', variant: 'destructive', className: 'bg-red-500/20 text-red-500' },

    // Subscription plans
    basic: { label: 'Basic', variant: 'secondary', className: 'bg-slate-500/20 text-slate-400' },
    pro: { label: 'Pro', variant: 'default', className: 'bg-violet-500/20 text-violet-400' },

    // Subscription status
    cancelled: { label: 'Cancelled', variant: 'secondary', className: 'bg-gray-500/20 text-gray-400' },
    expired: { label: 'Expired', variant: 'destructive', className: 'bg-red-500/20 text-red-500' },
    past_due: { label: 'Past Due', variant: 'destructive', className: 'bg-orange-500/20 text-orange-500' },
};

interface StatusBadgeProps {
    status: StatusType;
    className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const config = statusConfig[status] || {
        label: status,
        variant: 'outline' as const,
        className: ''
    };

    return (
        <Badge
            variant={config.variant}
            className={cn("font-medium", config.className, className)}
        >
            {config.label}
        </Badge>
    );
}
