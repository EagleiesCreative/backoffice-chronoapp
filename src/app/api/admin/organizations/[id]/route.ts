import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Fetch organization
        const { data: org, error: orgError } = await supabaseAdmin
            .from('organizations')
            .select('*')
            .eq('id', id)
            .single();

        if (orgError || !org) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
        }

        // Fetch members
        const { data: members } = await supabaseAdmin
            .from('organization_memberships')
            .select(`
                id,
                role,
                revenue_share_percentage,
                created_at,
                user:users(id, name, email, image_url)
            `)
            .eq('organization_id', id);

        // Fetch booths
        const { data: booths } = await supabaseAdmin
            .from('booths')
            .select('*')
            .eq('organization_id', id);

        // Check online status
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const boothsWithStatus = (booths || []).map(b => ({
            ...b,
            is_online: b.last_heartbeat && b.last_heartbeat > fiveMinutesAgo,
        }));

        // Fetch recent payments through booths
        const boothIds = booths?.map(b => b.id) || [];
        let payments: { id: string; amount: number; status: string; booth_name: string; created_at: string }[] = [];
        let totalRevenue = 0;

        if (boothIds.length > 0) {
            const { data: paymentsData } = await supabaseAdmin
                .from('payments')
                .select('id, amount, status, booth_id, created_at')
                .in('booth_id', boothIds)
                .order('created_at', { ascending: false })
                .limit(10);

            payments = (paymentsData || []).map(p => ({
                id: p.id,
                amount: p.amount || 0,
                status: p.status,
                booth_name: booths?.find(b => b.id === p.booth_id)?.name || 'Unknown',
                created_at: p.created_at,
            }));

            // Calculate total revenue
            const { data: allPayments } = await supabaseAdmin
                .from('payments')
                .select('amount')
                .in('status', ['PAID', 'SETTLED'])
                .in('booth_id', boothIds);

            totalRevenue = allPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
        }

        // Get revenue per month for chart (last 4 months)
        const revenueChart: { date: string; amount: number }[] = [];
        for (let i = 3; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
            const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString();

            let monthRevenue = 0;
            if (boothIds.length > 0) {
                const { data: monthPayments } = await supabaseAdmin
                    .from('payments')
                    .select('amount')
                    .in('status', ['PAID', 'SETTLED'])
                    .in('booth_id', boothIds)
                    .gte('created_at', monthStart)
                    .lte('created_at', monthEnd);
                monthRevenue = monthPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
            }

            revenueChart.push({
                date: date.toLocaleDateString('en-US', { month: 'short' }),
                amount: monthRevenue,
            });
        }

        // Format members
        const formattedMembers = (members || []).map(m => {
            const user = m.user as unknown as { id: string; name: string; email: string; image_url: string | null } | null;
            return {
                id: m.id,
                user_id: user?.id,
                name: user?.name || 'Unknown',
                email: user?.email || '',
                image_url: user?.image_url,
                role: m.role,
                revenue_share: m.revenue_share_percentage,
                created_at: m.created_at,
            };
        });

        return NextResponse.json({
            ...org,
            members: formattedMembers,
            booths: boothsWithStatus,
            payments,
            total_revenue: totalRevenue,
            revenue_chart: revenueChart,
        });
    } catch (error) {
        console.error('Organization detail API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();

        const { data, error } = await supabaseAdmin
            .from('organizations')
            .update({
                name: body.name,
                subscription_plan: body.subscription_plan,
                subscription_status: body.subscription_status,
                subscription_expires_at: body.subscription_expires_at,
                max_booths: body.max_booths,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating organization:', error);
            return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Organization update error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
