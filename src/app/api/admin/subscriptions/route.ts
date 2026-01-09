import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch all organizations with subscription info
        const { data: organizations } = await supabaseAdmin
            .from('organizations')
            .select('id, name, subscription_plan, subscription_status, subscription_expires_at, max_booths')
            .order('created_at', { ascending: false });

        // Calculate subscription distribution
        const basicCount = organizations?.filter(o => o.subscription_plan === 'basic').length || 0;
        const proCount = organizations?.filter(o => o.subscription_plan === 'pro').length || 0;
        const activeCount = organizations?.filter(o => o.subscription_status === 'active').length || 0;
        const cancelledCount = organizations?.filter(o => o.subscription_status === 'cancelled').length || 0;
        const expiredCount = organizations?.filter(o => o.subscription_status === 'expired').length || 0;

        // Calculate MRR (assuming basic = 0, pro = 499000 IDR/month)
        const PRO_PRICE = 499000;
        const currentMRR = proCount * PRO_PRICE;

        // Get subscription history for chart
        const { data: subscriptionHistory } = await supabaseAdmin
            .from('subscription_history')
            .select('action, amount, created_at')
            .order('created_at', { ascending: false })
            .limit(100);

        // Calculate MRR by month (last 6 months)
        const mrrChart: { date: string; mrr: number }[] = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthName = date.toLocaleDateString('en-US', { month: 'short' });

            // This is a simplified calculation - in production you'd track actual subscription changes
            // For now, we'll estimate based on current count minus churned
            const estimatedProCount = Math.max(0, proCount - Math.floor(i * 0.5));
            mrrChart.push({
                date: monthName,
                mrr: estimatedProCount * PRO_PRICE,
            });
        }

        // Recent subscription changes
        const recentChanges = (subscriptionHistory || []).slice(0, 10).map(h => ({
            action: h.action,
            amount: h.amount,
            created_at: h.created_at,
        }));

        // Subscription plans info
        const { data: plans } = await supabaseAdmin
            .from('subscription_plans')
            .select('*')
            .order('price', { ascending: true });

        return NextResponse.json({
            stats: {
                totalOrganizations: organizations?.length || 0,
                basicCount,
                proCount,
                activeCount,
                cancelledCount,
                expiredCount,
                currentMRR,
            },
            distribution: [
                { name: 'Basic', value: basicCount, color: '#64748b' },
                { name: 'Pro', value: proCount, color: '#8b5cf6' },
            ],
            statusDistribution: [
                { name: 'Active', value: activeCount, color: '#22c55e' },
                { name: 'Cancelled', value: cancelledCount, color: '#f59e0b' },
                { name: 'Expired', value: expiredCount, color: '#ef4444' },
            ],
            mrrChart,
            recentChanges,
            plans: plans || [],
            organizations: organizations || [],
        });
    } catch (error) {
        console.error('Subscriptions API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
