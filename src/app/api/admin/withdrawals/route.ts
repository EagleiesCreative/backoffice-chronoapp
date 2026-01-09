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
        const status = searchParams.get('status') || '';

        // Build query - fetch withdrawals without joins first
        let query = supabaseAdmin
            .from('withdrawals')
            .select('*', { count: 'exact' });

        // Apply status filter
        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        // Pagination
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data: withdrawals, error, count } = await query
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) {
            console.error('Error fetching withdrawals:', error);
            return NextResponse.json({ error: 'Failed to fetch withdrawals' }, { status: 500 });
        }

        // Fetch user and organization data separately
        const userIds = [...new Set((withdrawals || []).map(w => w.user_id).filter(Boolean))];
        const orgIds = [...new Set((withdrawals || []).map(w => w.organization_id).filter(Boolean))];

        // Fetch users
        let usersMap: Record<string, { name: string; email: string }> = {};
        if (userIds.length > 0) {
            const { data: users } = await supabaseAdmin
                .from('users')
                .select('id, name, email')
                .in('id', userIds);
            usersMap = (users || []).reduce((acc, u) => {
                acc[u.id] = { name: u.name || 'Unknown', email: u.email || '' };
                return acc;
            }, {} as Record<string, { name: string; email: string }>);
        }

        // Fetch organizations
        let orgsMap: Record<string, string> = {};
        if (orgIds.length > 0) {
            const { data: orgs } = await supabaseAdmin
                .from('organizations')
                .select('id, name')
                .in('id', orgIds);
            orgsMap = (orgs || []).reduce((acc, o) => {
                acc[o.id] = o.name || 'Unknown';
                return acc;
            }, {} as Record<string, string>);
        }

        const withdrawalsWithDetails = (withdrawals || []).map(w => ({
            ...w,
            user_name: usersMap[w.user_id]?.name || 'Unknown User',
            user_email: usersMap[w.user_id]?.email || '',
            organization_name: orgsMap[w.organization_id] || 'Unknown Org',
        }));

        return NextResponse.json({
            data: withdrawalsWithDetails,
            total: count || 0,
            page,
            pageSize,
            totalPages: Math.ceil((count || 0) / pageSize),
        });
    } catch (error) {
        console.error('Withdrawals API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, action } = body;

        if (!id || !['approve', 'reject'].includes(action)) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        const updateData: Record<string, unknown> = {
            status: action === 'approve' ? 'approved' : 'rejected',
            approved_by: userId,
            approved_at: new Date().toISOString(),
        };

        if (action === 'reject' && body.reason) {
            updateData.rejection_reason = body.reason;
        }

        const { data, error } = await supabaseAdmin
            .from('withdrawals')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating withdrawal:', error);
            return NextResponse.json({ error: 'Failed to update withdrawal' }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Withdrawal update error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
