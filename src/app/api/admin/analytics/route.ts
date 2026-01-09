import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get date range (default: last 30 days)
        const { searchParams } = new URL(request.url);
        const days = parseInt(searchParams.get('days') || '30');

        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

        // Fetch all payments in range
        const { data: payments } = await supabaseAdmin
            .from('payments')
            .select('amount, status, payment_method, created_at')
            .gte('created_at', startDate);

        // Calculate totals
        const successfulPayments = payments?.filter(p => p.status === 'PAID' || p.status === 'SETTLED') || [];
        const totalRevenue = successfulPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const totalTransactions = successfulPayments.length;
        const avgTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

        // Revenue by day
        const revenueByDate: Record<string, number> = {};
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split('T')[0];
            revenueByDate[dateStr] = 0;
        }

        successfulPayments.forEach(p => {
            const dateStr = p.created_at?.split('T')[0];
            if (dateStr && revenueByDate[dateStr] !== undefined) {
                revenueByDate[dateStr] += p.amount || 0;
            }
        });

        const revenueChart = Object.entries(revenueByDate).map(([date, amount]) => ({
            date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            amount,
        }));

        // Payment methods distribution
        const methodCounts: Record<string, number> = {};
        successfulPayments.forEach(p => {
            const method = p.payment_method || 'Unknown';
            methodCounts[method] = (methodCounts[method] || 0) + 1;
        });

        const paymentMethods = Object.entries(methodCounts).map(([method, count]) => ({
            name: method,
            value: count,
        }));

        // Get counts
        const [
            { count: orgCount },
            { count: userCount },
            { count: boothCount },
            { count: sessionCount },
        ] = await Promise.all([
            supabaseAdmin.from('organizations').select('*', { count: 'exact', head: true }),
            supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
            supabaseAdmin.from('booths').select('*', { count: 'exact', head: true }),
            supabaseAdmin.from('sessions').select('*', { count: 'exact', head: true }).gte('created_at', startDate),
        ]);

        // Growth metrics (compare to previous period)
        const previousStart = new Date(Date.now() - days * 2 * 24 * 60 * 60 * 1000).toISOString();
        const previousEnd = startDate;

        const { data: previousPayments } = await supabaseAdmin
            .from('payments')
            .select('amount, status')
            .gte('created_at', previousStart)
            .lt('created_at', previousEnd)
            .in('status', ['PAID', 'SETTLED']);

        const previousRevenue = previousPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
        const revenueGrowth = previousRevenue > 0
            ? Math.round(((totalRevenue - previousRevenue) / previousRevenue) * 100)
            : 0;

        // Top booths by revenue
        const { data: boothPayments } = await supabaseAdmin
            .from('payments')
            .select(`
                amount,
                booth:booths(id, name, organization:organizations(name))
            `)
            .in('status', ['PAID', 'SETTLED'])
            .gte('created_at', startDate);

        const boothRevenue: Record<string, { name: string; org: string; revenue: number }> = {};
        boothPayments?.forEach(p => {
            const booth = p.booth as unknown as { id: string; name: string; organization: { name: string } | null } | null;
            if (booth?.id) {
                if (!boothRevenue[booth.id]) {
                    boothRevenue[booth.id] = {
                        name: booth.name,
                        org: booth.organization?.name || 'Unknown',
                        revenue: 0,
                    };
                }
                boothRevenue[booth.id].revenue += p.amount || 0;
            }
        });

        const topBooths = Object.values(boothRevenue)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        return NextResponse.json({
            stats: {
                totalRevenue,
                totalTransactions,
                avgTransactionValue,
                revenueGrowth,
                orgCount: orgCount || 0,
                userCount: userCount || 0,
                boothCount: boothCount || 0,
                sessionCount: sessionCount || 0,
            },
            revenueChart,
            paymentMethods,
            topBooths,
        });
    } catch (error) {
        console.error('Analytics API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
