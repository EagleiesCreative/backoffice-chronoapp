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
        const reportType = searchParams.get('type') || 'revenue';
        const startDate = searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0];
        const format = searchParams.get('format') || 'json'; // json, csv

        let data: Record<string, unknown>[] = [];
        let columns: { key: string; label: string }[] = [];

        switch (reportType) {
            case 'revenue':
                const { data: payments } = await supabaseAdmin
                    .from('payments')
                    .select('id, amount, status, payment_method, created_at, paid_at, booth_id')
                    .gte('created_at', `${startDate}T00:00:00`)
                    .lte('created_at', `${endDate}T23:59:59`)
                    .order('created_at', { ascending: false });

                // Get booth info
                const boothIds = [...new Set((payments || []).map(p => p.booth_id).filter(Boolean))];
                let boothsMap: Record<string, { name: string; org: string }> = {};
                if (boothIds.length > 0) {
                    const { data: booths } = await supabaseAdmin
                        .from('booths')
                        .select('id, name, organization_id')
                        .in('id', boothIds);

                    const orgIds = [...new Set((booths || []).map(b => b.organization_id).filter(Boolean))];
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
                    boothsMap = (booths || []).reduce((acc, b) => {
                        acc[b.id] = { name: b.name || 'Unknown', org: orgsMap[b.organization_id] || 'Unknown' };
                        return acc;
                    }, {} as Record<string, { name: string; org: string }>);
                }

                data = (payments || []).map(p => ({
                    id: p.id,
                    date: p.created_at?.split('T')[0],
                    time: p.created_at?.split('T')[1]?.slice(0, 8),
                    amount: p.amount,
                    status: p.status,
                    payment_method: p.payment_method || '-',
                    booth: boothsMap[p.booth_id]?.name || 'Unknown',
                    organization: boothsMap[p.booth_id]?.org || 'Unknown',
                }));
                columns = [
                    { key: 'date', label: 'Date' },
                    { key: 'time', label: 'Time' },
                    { key: 'organization', label: 'Organization' },
                    { key: 'booth', label: 'Booth' },
                    { key: 'amount', label: 'Amount (IDR)' },
                    { key: 'status', label: 'Status' },
                    { key: 'payment_method', label: 'Method' },
                ];
                break;

            case 'withdrawals':
                const { data: withdrawals } = await supabaseAdmin
                    .from('withdrawals')
                    .select('*')
                    .gte('created_at', `${startDate}T00:00:00`)
                    .lte('created_at', `${endDate}T23:59:59`)
                    .order('created_at', { ascending: false });

                const wUserIds = [...new Set((withdrawals || []).map(w => w.user_id).filter(Boolean))];
                const wOrgIds = [...new Set((withdrawals || []).map(w => w.organization_id).filter(Boolean))];

                let wUsersMap: Record<string, string> = {};
                let wOrgsMap: Record<string, string> = {};

                if (wUserIds.length > 0) {
                    const { data: users } = await supabaseAdmin.from('users').select('id, name').in('id', wUserIds);
                    wUsersMap = (users || []).reduce((acc, u) => { acc[u.id] = u.name || 'Unknown'; return acc; }, {} as Record<string, string>);
                }
                if (wOrgIds.length > 0) {
                    const { data: orgs } = await supabaseAdmin.from('organizations').select('id, name').in('id', wOrgIds);
                    wOrgsMap = (orgs || []).reduce((acc, o) => { acc[o.id] = o.name || 'Unknown'; return acc; }, {} as Record<string, string>);
                }

                data = (withdrawals || []).map(w => ({
                    id: w.id,
                    date: w.created_at?.split('T')[0],
                    user: wUsersMap[w.user_id] || 'Unknown',
                    organization: wOrgsMap[w.organization_id] || 'Unknown',
                    amount: w.amount,
                    fee: w.fee,
                    net_amount: w.net_amount,
                    status: w.status,
                    bank: w.bank_name,
                    account: w.bank_account_number,
                }));
                columns = [
                    { key: 'date', label: 'Date' },
                    { key: 'user', label: 'User' },
                    { key: 'organization', label: 'Organization' },
                    { key: 'amount', label: 'Amount (IDR)' },
                    { key: 'fee', label: 'Fee' },
                    { key: 'net_amount', label: 'Net Amount' },
                    { key: 'status', label: 'Status' },
                    { key: 'bank', label: 'Bank' },
                ];
                break;

            case 'organizations':
                const { data: orgs } = await supabaseAdmin
                    .from('organizations')
                    .select('*')
                    .order('created_at', { ascending: false });

                data = (orgs || []).map(o => ({
                    id: o.id,
                    name: o.name,
                    slug: o.slug,
                    plan: o.subscription_plan,
                    status: o.subscription_status,
                    max_booths: o.max_booths,
                    expires: o.subscription_expires_at?.split('T')[0] || '-',
                    created: o.created_at?.split('T')[0],
                }));
                columns = [
                    { key: 'name', label: 'Organization' },
                    { key: 'slug', label: 'Slug' },
                    { key: 'plan', label: 'Plan' },
                    { key: 'status', label: 'Status' },
                    { key: 'max_booths', label: 'Max Booths' },
                    { key: 'expires', label: 'Expires' },
                    { key: 'created', label: 'Created' },
                ];
                break;

            case 'booths':
                const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
                const { data: allBooths } = await supabaseAdmin
                    .from('booths')
                    .select('*')
                    .order('created_at', { ascending: false });

                const bOrgIds = [...new Set((allBooths || []).map(b => b.organization_id).filter(Boolean))];
                let bOrgsMap: Record<string, string> = {};
                if (bOrgIds.length > 0) {
                    const { data: orgsData } = await supabaseAdmin.from('organizations').select('id, name').in('id', bOrgIds);
                    bOrgsMap = (orgsData || []).reduce((acc, o) => { acc[o.id] = o.name || 'Unknown'; return acc; }, {} as Record<string, string>);
                }

                data = (allBooths || []).map(b => ({
                    id: b.id,
                    name: b.name,
                    organization: bOrgsMap[b.organization_id] || 'Unknown',
                    location: b.location || '-',
                    price: b.price,
                    status: b.status,
                    online: b.last_heartbeat && b.last_heartbeat > fiveMinutesAgo ? 'Yes' : 'No',
                    last_seen: b.last_heartbeat?.split('T')[0] || '-',
                }));
                columns = [
                    { key: 'name', label: 'Booth Name' },
                    { key: 'organization', label: 'Organization' },
                    { key: 'location', label: 'Location' },
                    { key: 'price', label: 'Price (IDR)' },
                    { key: 'status', label: 'Status' },
                    { key: 'online', label: 'Online' },
                    { key: 'last_seen', label: 'Last Seen' },
                ];
                break;

            default:
                return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
        }

        // Calculate summary
        const summary = {
            totalRecords: data.length,
            dateRange: `${startDate} to ${endDate}`,
            reportType,
            generatedAt: new Date().toISOString(),
        };

        // If CSV format requested, convert to CSV
        if (format === 'csv') {
            const header = columns.map(c => c.label).join(',');
            const rows = data.map(row =>
                columns.map(c => {
                    const value = row[c.key];
                    // Escape commas and quotes in values
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value ?? '';
                }).join(',')
            );
            const csv = [header, ...rows].join('\n');

            return new NextResponse(csv, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="${reportType}-report-${startDate}-${endDate}.csv"`,
                },
            });
        }

        return NextResponse.json({
            data,
            columns,
            summary,
        });
    } catch (error) {
        console.error('Reports API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
