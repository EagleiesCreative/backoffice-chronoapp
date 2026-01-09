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
        const role = searchParams.get('role') || '';

        let query = supabaseAdmin
            .from('users')
            .select('*', { count: 'exact' });

        // Apply filters
        if (search) {
            query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
        }

        // Pagination
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        query = query
            .order('created_at', { ascending: false })
            .range(from, to);

        const { data, error, count } = await query;

        if (error) {
            console.error('Error fetching users:', error);
            return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
        }

        // Get organization memberships for each user
        const usersWithOrgs = await Promise.all(
            (data || []).map(async (user) => {
                const { data: memberships } = await supabaseAdmin
                    .from('organization_memberships')
                    .select(`
            role,
            organization:organizations(id, name)
          `)
                    .eq('user_id', user.id);

                const organizations = memberships?.map(m => {
                    const org = m.organization as unknown as { id: string; name: string } | null;
                    return org?.name;
                }).filter(Boolean) || [];
                const primaryRole = memberships?.[0]?.role || 'org:member';

                return {
                    ...user,
                    organizations,
                    primary_role: primaryRole,
                };
            })
        );

        // Filter by role if specified
        let filteredUsers = usersWithOrgs;
        if (role && role !== 'all') {
            filteredUsers = usersWithOrgs.filter(u => u.primary_role === role);
        }

        return NextResponse.json({
            data: filteredUsers,
            total: count || 0,
            page,
            pageSize,
            totalPages: Math.ceil((count || 0) / pageSize),
        });
    } catch (error) {
        console.error('Users API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
