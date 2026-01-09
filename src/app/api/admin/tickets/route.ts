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
        const status = searchParams.get('status') || 'all';
        const priority = searchParams.get('priority') || 'all';

        let query = supabaseAdmin
            .from('support_tickets')
            .select('*')
            .order('created_at', { ascending: false });

        if (status !== 'all') {
            query = query.eq('status', status);
        }
        if (priority !== 'all') {
            query = query.eq('priority', priority);
        }

        const { data: tickets, error } = await query;

        if (error) {
            if (error.code === '42P01') {
                return NextResponse.json({
                    data: [],
                    tableExists: false
                });
            }
            throw error;
        }

        // Get user and org info
        const userIds = [...new Set((tickets || []).map(t => t.user_id).filter(Boolean))];
        const orgIds = [...new Set((tickets || []).map(t => t.organization_id).filter(Boolean))];

        let usersMap: Record<string, string> = {};
        let orgsMap: Record<string, string> = {};

        if (userIds.length > 0) {
            const { data: users } = await supabaseAdmin.from('users').select('id, name').in('id', userIds);
            usersMap = (users || []).reduce((acc, u) => { acc[u.id] = u.name || 'Unknown'; return acc; }, {} as Record<string, string>);
        }
        if (orgIds.length > 0) {
            const { data: orgs } = await supabaseAdmin.from('organizations').select('id, name').in('id', orgIds);
            orgsMap = (orgs || []).reduce((acc, o) => { acc[o.id] = o.name || 'Unknown'; return acc; }, {} as Record<string, string>);
        }

        const ticketsWithInfo = (tickets || []).map(t => ({
            ...t,
            user_name: usersMap[t.user_id] || 'Unknown',
            organization_name: orgsMap[t.organization_id] || 'Unknown',
        }));

        // Get stats
        const stats = {
            open: (tickets || []).filter(t => t.status === 'open').length,
            in_progress: (tickets || []).filter(t => t.status === 'in_progress').length,
            resolved: (tickets || []).filter(t => t.status === 'resolved' || t.status === 'closed').length,
            urgent: (tickets || []).filter(t => t.priority === 'urgent' || t.priority === 'high').length,
        };

        return NextResponse.json({ data: ticketsWithInfo, stats, tableExists: true });
    } catch (error) {
        console.error('Support tickets API error:', error);
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
        const { id, status, priority, assigned_to } = body;

        if (!id) {
            return NextResponse.json({ error: 'Ticket ID required' }, { status: 400 });
        }

        const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (status) updateData.status = status;
        if (priority) updateData.priority = priority;
        if (assigned_to !== undefined) updateData.assigned_to = assigned_to;
        if (status === 'resolved' || status === 'closed') {
            updateData.resolved_at = new Date().toISOString();
        }

        const { data, error } = await supabaseAdmin
            .from('support_tickets')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        console.error('Update ticket error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
