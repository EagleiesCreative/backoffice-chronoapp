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

        // Fetch user
        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', id)
            .single();

        if (userError || !user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Fetch organization memberships
        const { data: memberships } = await supabaseAdmin
            .from('organization_memberships')
            .select(`
                id,
                role,
                revenue_share_percentage,
                bank_name,
                bank_account_number,
                bank_account_holder,
                created_at,
                organization:organizations(id, name, slug, subscription_plan)
            `)
            .eq('user_id', id);

        // Fetch withdrawals
        const { data: withdrawals } = await supabaseAdmin
            .from('withdrawals')
            .select(`
                id,
                amount,
                fee,
                net_amount,
                status,
                bank_name,
                bank_account_number,
                created_at,
                approved_at,
                completed_at,
                organization:organizations(name)
            `)
            .eq('user_id', id)
            .order('created_at', { ascending: false })
            .limit(20);

        // Calculate total withdrawn
        const totalWithdrawn = withdrawals
            ?.filter(w => w.status === 'completed')
            .reduce((sum, w) => sum + (w.net_amount || 0), 0) || 0;

        // Format organizations
        const organizations = (memberships || []).map(m => {
            const org = m.organization as unknown as { id: string; name: string; slug: string; subscription_plan: string } | null;
            return {
                id: org?.id,
                name: org?.name || 'Unknown',
                slug: org?.slug || '',
                subscription_plan: org?.subscription_plan || 'basic',
                role: m.role,
                revenue_share: m.revenue_share_percentage,
                bank_name: m.bank_name,
                bank_account_number: m.bank_account_number,
                bank_account_holder: m.bank_account_holder,
                joined_at: m.created_at,
            };
        });

        // Format withdrawals
        const formattedWithdrawals = (withdrawals || []).map(w => {
            const org = w.organization as unknown as { name: string } | null;
            return {
                id: w.id,
                amount: w.amount,
                fee: w.fee,
                net_amount: w.net_amount,
                status: w.status,
                bank_name: w.bank_name,
                bank_account_number: w.bank_account_number,
                organization_name: org?.name || 'Unknown',
                created_at: w.created_at,
                approved_at: w.approved_at,
                completed_at: w.completed_at,
            };
        });

        return NextResponse.json({
            ...user,
            organizations,
            withdrawals: formattedWithdrawals,
            total_withdrawn: totalWithdrawn,
            organization_count: organizations.length,
        });
    } catch (error) {
        console.error('User detail API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
