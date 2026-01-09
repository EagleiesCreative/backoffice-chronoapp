import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const days = parseInt(searchParams.get('days') || '30');
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

        // Get all booths with their organizations
        const { data: booths } = await supabaseAdmin
            .from('booths')
            .select('id, name, status, price, location, last_heartbeat, organization_id');

        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

        // Get payments for each booth
        const { data: payments } = await supabaseAdmin
            .from('payments')
            .select('booth_id, amount, status, created_at')
            .in('status', ['PAID', 'SETTLED'])
            .gte('created_at', startDate);

        // Get sessions for each booth
        const { data: sessions } = await supabaseAdmin
            .from('sessions')
            .select('booth_id, created_at, duration')
            .gte('created_at', startDate);

        // Get org names
        const orgIds = [...new Set((booths || []).map(b => b.organization_id).filter(Boolean))];
        let orgsMap: Record<string, string> = {};
        if (orgIds.length > 0) {
            const { data: orgs } = await supabaseAdmin.from('organizations').select('id, name').in('id', orgIds);
            orgsMap = (orgs || []).reduce((acc, o) => { acc[o.id] = o.name || 'Unknown'; return acc; }, {} as Record<string, string>);
        }

        // Aggregate booth performance
        const boothPerformance = (booths || []).map(booth => {
            const boothPayments = (payments || []).filter(p => p.booth_id === booth.id);
            const boothSessions = (sessions || []).filter(s => s.booth_id === booth.id);

            const revenue = boothPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
            const sessionCount = boothSessions.length;
            const avgSessionDuration = sessionCount > 0
                ? boothSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessionCount
                : 0;
            const is_online = booth.last_heartbeat && booth.last_heartbeat > fiveMinutesAgo;

            return {
                id: booth.id,
                name: booth.name || 'Unnamed',
                organization: orgsMap[booth.organization_id] || 'Unknown',
                location: booth.location || '-',
                price: booth.price || 0,
                status: booth.status,
                is_online,
                revenue,
                sessions: sessionCount,
                avgSessionDuration: Math.round(avgSessionDuration),
                last_heartbeat: booth.last_heartbeat,
            };
        });

        // Sort by revenue descending
        boothPerformance.sort((a, b) => b.revenue - a.revenue);

        // Calculate totals
        const totals = {
            totalBooths: boothPerformance.length,
            onlineBooths: boothPerformance.filter(b => b.is_online).length,
            totalRevenue: boothPerformance.reduce((sum, b) => sum + b.revenue, 0),
            totalSessions: boothPerformance.reduce((sum, b) => sum + b.sessions, 0),
        };

        // Revenue by day for top 5 booths
        const top5BoothIds = boothPerformance.slice(0, 5).map(b => b.id);
        const revenueByBooth: Record<string, Record<string, number>> = {};

        top5BoothIds.forEach(id => { revenueByBooth[id] = {}; });

        (payments || [])
            .filter(p => top5BoothIds.includes(p.booth_id))
            .forEach(p => {
                const dateStr = p.created_at?.split('T')[0];
                if (dateStr && revenueByBooth[p.booth_id]) {
                    revenueByBooth[p.booth_id][dateStr] = (revenueByBooth[p.booth_id][dateStr] || 0) + (p.amount || 0);
                }
            });

        return NextResponse.json({
            booths: boothPerformance,
            totals,
            revenueByBooth,
            top5Names: boothPerformance.slice(0, 5).map(b => ({ id: b.id, name: b.name })),
        });
    } catch (error) {
        console.error('Booth performance API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
