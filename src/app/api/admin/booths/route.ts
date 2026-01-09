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

        // Fetch booths with organization info
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data: booths, error, count } = await supabaseAdmin
            .from('booths')
            .select(`
                *,
                organization:organizations(name)
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) {
            console.error('Error fetching booths:', error);
            return NextResponse.json({ error: 'Failed to fetch booths' }, { status: 500 });
        }

        // Calculate online status (heartbeat within last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

        const boothsWithStatus = (booths || []).map(booth => ({
            ...booth,
            is_online: booth.last_heartbeat && booth.last_heartbeat > fiveMinutesAgo,
            organization_name: (booth.organization as { name: string } | null)?.name || 'Unknown',
        }));

        return NextResponse.json({
            data: boothsWithStatus,
            total: count || 0,
            page,
            pageSize,
            totalPages: Math.ceil((count || 0) / pageSize),
        });
    } catch (error) {
        console.error('Booths API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
