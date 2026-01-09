import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch counts
        const [
            { count: totalOrganizations },
            { count: totalUsers },
            { count: totalBooths },
            { data: booths },
            { data: withdrawals },
            { data: payments },
            { data: organizations },
        ] = await Promise.all([
            supabaseAdmin.from('organizations').select('*', { count: 'exact', head: true }),
            supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
            supabaseAdmin.from('booths').select('*', { count: 'exact', head: true }),
            supabaseAdmin.from('booths').select('id, last_heartbeat'),
            supabaseAdmin
                .from('withdrawals')
                .select(`
                    id,
                    amount,
                    bank_name,
                    created_at,
                    user:users(name)
                `)
                .eq('status', 'pending')
                .order('created_at', { ascending: false })
                .limit(10),
            supabaseAdmin
                .from('payments')
                .select(`
                    id,
                    amount,
                    created_at,
                    booth:booths(name)
                `)
                .in('status', ['PAID', 'SETTLED'])
                .order('created_at', { ascending: false })
                .limit(10),
            supabaseAdmin
                .from('organizations')
                .select('subscription_plan'),
        ]);

        // Calculate online booths (heartbeat within last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const onlineBooths = booths?.filter(b =>
            b.last_heartbeat && b.last_heartbeat > fiveMinutesAgo
        ).length || 0;

        // Calculate subscription distribution
        const basicCount = organizations?.filter(o => o.subscription_plan === 'basic').length || 0;
        const proCount = organizations?.filter(o => o.subscription_plan === 'pro').length || 0;

        // Get revenue data for this month and last month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

        const [{ data: thisMonthPayments }, { data: lastMonthPayments }] = await Promise.all([
            supabaseAdmin
                .from('payments')
                .select('amount')
                .in('status', ['PAID', 'SETTLED'])
                .gte('created_at', startOfMonth),
            supabaseAdmin
                .from('payments')
                .select('amount')
                .in('status', ['PAID', 'SETTLED'])
                .gte('created_at', startOfLastMonth)
                .lte('created_at', endOfLastMonth),
        ]);

        const revenueThisMonth = thisMonthPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
        const revenueLastMonth = lastMonthPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

        // Get daily revenue for chart (last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const { data: chartPayments } = await supabaseAdmin
            .from('payments')
            .select('amount, created_at')
            .in('status', ['PAID', 'SETTLED'])
            .gte('created_at', sevenDaysAgo.toISOString());

        // Group by date
        const revenueByDate: Record<string, number> = {};
        for (let i = 6; i >= 0; i--) {
            const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            revenueByDate[dateStr] = 0;
        }

        chartPayments?.forEach(p => {
            const date = new Date(p.created_at);
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (revenueByDate[dateStr] !== undefined) {
                revenueByDate[dateStr] += p.amount || 0;
            }
        });

        const revenueChart = Object.entries(revenueByDate).map(([date, amount]) => ({
            date,
            amount,
        }));

        // Format withdrawals
        const pendingWithdrawals = (withdrawals || []).map(w => ({
            id: w.id,
            amount: w.amount || 0,
            bank_name: w.bank_name || 'Unknown',
            created_at: w.created_at,
            user_name: (w.user as unknown as { name: string } | null)?.name || 'Unknown',
        }));

        // Format recent payments
        const recentPayments = (payments || []).map(p => ({
            id: p.id,
            amount: p.amount || 0,
            booth_name: (p.booth as unknown as { name: string } | null)?.name || 'Unknown Booth',
            created_at: p.created_at,
        }));

        return NextResponse.json({
            totalOrganizations: totalOrganizations || 0,
            totalUsers: totalUsers || 0,
            totalBooths: totalBooths || 0,
            onlineBooths,
            revenueThisMonth,
            revenueLastMonth,
            pendingWithdrawals,
            recentPayments,
            subscriptionDistribution: [
                { name: 'Basic', value: basicCount, color: '#64748b' },
                { name: 'Pro', value: proCount, color: '#8b5cf6' },
            ],
            revenueChart,
        });
    } catch (error) {
        console.error('Dashboard API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
