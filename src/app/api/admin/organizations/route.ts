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
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '10');
        const search = searchParams.get('search') || '';
        const plan = searchParams.get('plan') || '';
        const status = searchParams.get('status') || '';

        let query = supabaseAdmin
            .from('organizations')
            .select('*', { count: 'exact' });

        // Apply filters
        if (search) {
            query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
        }

        if (plan && plan !== 'all') {
            query = query.eq('subscription_plan', plan);
        }

        if (status && status !== 'all') {
            query = query.eq('subscription_status', status);
        }

        // Pagination
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        query = query
            .order('created_at', { ascending: false })
            .range(from, to);

        const { data, error, count } = await query;

        if (error) {
            console.error('Error fetching organizations:', error);
            return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 });
        }

        // Get additional stats for each organization
        const orgsWithStats = await Promise.all(
            (data || []).map(async (org) => {
                const [
                    { count: boothsCount },
                    { count: membersCount },
                    { data: payments }
                ] = await Promise.all([
                    supabaseAdmin
                        .from('booths')
                        .select('*', { count: 'exact', head: true })
                        .eq('organization_id', org.id),
                    supabaseAdmin
                        .from('organization_memberships')
                        .select('*', { count: 'exact', head: true })
                        .eq('organization_id', org.id),
                    supabaseAdmin
                        .from('payments')
                        .select('amount')
                        .in('status', ['PAID', 'SETTLED'])
                        .eq('booth_id', 'placeholder') // We need to join through booths
                ]);

                // Get total revenue through booths
                const { data: boothIds } = await supabaseAdmin
                    .from('booths')
                    .select('id')
                    .eq('organization_id', org.id);

                let totalRevenue = 0;
                if (boothIds && boothIds.length > 0) {
                    const { data: paymentsData } = await supabaseAdmin
                        .from('payments')
                        .select('amount')
                        .in('status', ['PAID', 'SETTLED'])
                        .in('booth_id', boothIds.map(b => b.id));
                    totalRevenue = paymentsData?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
                }

                return {
                    ...org,
                    booths_count: boothsCount || 0,
                    members_count: membersCount || 0,
                    total_revenue: totalRevenue,
                };
            })
        );

        return NextResponse.json({
            data: orgsWithStats,
            total: count || 0,
            page,
            pageSize,
            totalPages: Math.ceil((count || 0) / pageSize),
        });
    } catch (error) {
        console.error('Organizations API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
