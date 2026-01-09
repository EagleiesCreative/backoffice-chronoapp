import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check system health metrics

        // 1. Database connectivity
        const dbStartTime = Date.now();
        const { error: dbError } = await supabaseAdmin.from('organizations').select('id').limit(1);
        const dbResponseTime = Date.now() - dbStartTime;
        const dbStatus = dbError ? 'error' : dbResponseTime < 500 ? 'healthy' : 'degraded';

        // 2. Booth online status
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { data: booths } = await supabaseAdmin
            .from('booths')
            .select('id, name, status, last_heartbeat, organization:organizations(name)');

        const boothsWithStatus = (booths || []).map(b => {
            const org = b.organization as unknown as { name: string } | null;
            return {
                id: b.id,
                name: b.name,
                status: b.status,
                is_online: b.last_heartbeat && b.last_heartbeat > fiveMinutesAgo,
                organization_name: org?.name || 'Unknown',
                last_heartbeat: b.last_heartbeat,
            };
        });

        const totalBooths = boothsWithStatus.length;
        const onlineBooths = boothsWithStatus.filter(b => b.is_online).length;
        const offlineBooths = boothsWithStatus.filter(b => !b.is_online);

        // 3. Recent errors (payments that failed in last 24 hours)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: failedPayments, count: failedCount } = await supabaseAdmin
            .from('payments')
            .select('id, booth_id, created_at, status', { count: 'exact' })
            .in('status', ['FAILED', 'EXPIRED'])
            .gte('created_at', oneDayAgo)
            .order('created_at', { ascending: false })
            .limit(10);

        // 4. Pending withdrawals (action needed)
        const { count: pendingWithdrawals } = await supabaseAdmin
            .from('withdrawals')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');

        // 5. System stats
        const [
            { count: orgCount },
            { count: userCount },
            { count: boothCount },
            { count: todayPayments },
        ] = await Promise.all([
            supabaseAdmin.from('organizations').select('*', { count: 'exact', head: true }),
            supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
            supabaseAdmin.from('booths').select('*', { count: 'exact', head: true }),
            supabaseAdmin
                .from('payments')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', new Date().toISOString().split('T')[0]),
        ]);

        // Determine overall health
        let overallHealth: 'healthy' | 'degraded' | 'critical' = 'healthy';
        const alerts: { type: 'error' | 'warning' | 'info'; message: string }[] = [];

        if (dbStatus === 'error') {
            overallHealth = 'critical';
            alerts.push({ type: 'error', message: 'Database connection issues detected' });
        } else if (dbStatus === 'degraded') {
            overallHealth = 'degraded';
            alerts.push({ type: 'warning', message: `Database response slow (${dbResponseTime}ms)` });
        }

        if (offlineBooths.length > 0 && totalBooths > 0) {
            const offlinePercentage = (offlineBooths.length / totalBooths) * 100;
            if (offlinePercentage > 50) {
                if (overallHealth === 'healthy') overallHealth = 'degraded';
                alerts.push({ type: 'warning', message: `${offlineBooths.length} booths are offline` });
            } else if (offlineBooths.length > 0) {
                alerts.push({ type: 'info', message: `${offlineBooths.length} booths are offline` });
            }
        }

        if ((failedCount || 0) > 10) {
            if (overallHealth === 'healthy') overallHealth = 'degraded';
            alerts.push({ type: 'warning', message: `High payment failure rate: ${failedCount} in last 24h` });
        }

        if ((pendingWithdrawals || 0) > 5) {
            alerts.push({ type: 'info', message: `${pendingWithdrawals} pending withdrawals need attention` });
        }

        return NextResponse.json({
            overallHealth,
            alerts,
            services: [
                {
                    name: 'Database (Supabase)',
                    status: dbStatus,
                    responseTime: dbResponseTime,
                    details: 'PostgreSQL database',
                },
                {
                    name: 'Authentication (Clerk)',
                    status: 'healthy',
                    responseTime: null,
                    details: 'User authentication',
                },
                {
                    name: 'Payment Gateway (Xendit)',
                    status: (failedCount || 0) > 10 ? 'degraded' : 'healthy',
                    responseTime: null,
                    details: `${failedCount || 0} failed payments in 24h`,
                },
                {
                    name: 'Booth Network',
                    status: onlineBooths === 0 && totalBooths > 0 ? 'degraded' : 'healthy',
                    responseTime: null,
                    details: `${onlineBooths}/${totalBooths} booths online`,
                },
            ],
            stats: {
                organizations: orgCount || 0,
                users: userCount || 0,
                booths: boothCount || 0,
                onlineBooths,
                offlineBooths: totalBooths - onlineBooths,
                todayPayments: todayPayments || 0,
                pendingWithdrawals: pendingWithdrawals || 0,
                failedPayments24h: failedCount || 0,
            },
            boothGrid: boothsWithStatus,
            recentErrors: (failedPayments || []).map(p => ({
                id: p.id,
                type: p.status,
                message: `Payment ${p.status.toLowerCase()}`,
                created_at: p.created_at,
            })),
        });
    } catch (error) {
        console.error('System health API error:', error);
        return NextResponse.json({
            overallHealth: 'critical',
            alerts: [{ type: 'error', message: 'Failed to fetch system health data' }],
            services: [],
            stats: {},
            boothGrid: [],
            recentErrors: [],
        }, { status: 500 });
    }
}
