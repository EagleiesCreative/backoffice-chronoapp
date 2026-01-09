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

        // Build query
        let query = supabaseAdmin
            .from('payments')
            .select(`
                *,
                booth:booths(name, organization:organizations(name))
            `, { count: 'exact' });

        // Apply status filter
        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        // Pagination
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data: payments, error, count } = await query
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) {
            console.error('Error fetching payments:', error);
            return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
        }

        const paymentsWithDetails = (payments || []).map(p => {
            const booth = p.booth as unknown as { name: string; organization: { name: string } | null } | null;
            return {
                ...p,
                booth_name: booth?.name || 'Unknown Booth',
                organization_name: booth?.organization?.name || 'Unknown Org',
            };
        });

        return NextResponse.json({
            data: paymentsWithDetails,
            total: count || 0,
            page,
            pageSize,
            totalPages: Math.ceil((count || 0) / pageSize),
        });
    } catch (error) {
        console.error('Payments API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
