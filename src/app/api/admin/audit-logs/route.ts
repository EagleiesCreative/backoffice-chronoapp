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
        const pageSize = parseInt(searchParams.get('pageSize') || '50');
        const type = searchParams.get('type') || '';
        const entity = searchParams.get('entity') || '';

        // Build query for audit logs
        let query = supabaseAdmin
            .from('audit_logs')
            .select('*', { count: 'exact' });

        // Apply filters
        if (type && type !== 'all') {
            query = query.eq('action_type', type);
        }

        if (entity && entity !== 'all') {
            query = query.eq('entity_type', entity);
        }

        // Pagination
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data: logs, error, count } = await query
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) {
            // If audit_logs table doesn't exist, return mock data for demo
            if (error.code === '42P01') {
                return NextResponse.json({
                    data: [],
                    total: 0,
                    page,
                    pageSize,
                    totalPages: 0,
                    tableExists: false,
                    message: 'Audit logs table not found. Please run migration to create it.',
                });
            }
            console.error('Error fetching audit logs:', error);
            return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
        }

        // Get user info for actor_ids
        const actorIds = [...new Set((logs || []).map(l => l.actor_id).filter(Boolean))];
        let usersMap: Record<string, { name: string; email: string }> = {};
        if (actorIds.length > 0) {
            const { data: users } = await supabaseAdmin
                .from('users')
                .select('id, name, email')
                .in('id', actorIds);
            usersMap = (users || []).reduce((acc, u) => {
                acc[u.id] = { name: u.name || 'Unknown', email: u.email || '' };
                return acc;
            }, {} as Record<string, { name: string; email: string }>);
        }

        const logsWithActors = (logs || []).map(log => ({
            ...log,
            actor_name: usersMap[log.actor_id]?.name || log.actor_id || 'System',
            actor_email: usersMap[log.actor_id]?.email || '',
        }));

        return NextResponse.json({
            data: logsWithActors,
            total: count || 0,
            page,
            pageSize,
            totalPages: Math.ceil((count || 0) / pageSize),
            tableExists: true,
        });
    } catch (error) {
        console.error('Audit logs API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Helper to log an action (can be called from other API routes)
export async function logAuditAction(
    actorId: string | null,
    actionType: string,
    entityType: string,
    entityId: string,
    description: string,
    metadata?: Record<string, unknown>
) {
    try {
        await supabaseAdmin.from('audit_logs').insert({
            actor_id: actorId,
            action_type: actionType,
            entity_type: entityType,
            entity_id: entityId,
            description,
            metadata: metadata || {},
            ip_address: null, // Would need request context
            created_at: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Failed to log audit action:', error);
    }
}
