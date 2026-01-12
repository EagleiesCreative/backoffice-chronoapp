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

        // Deduplicate payments by xendit_invoice_id
        // Priority: PAID/SETTLED > PENDING > EXPIRED > FAILED
        const statusPriority: Record<string, number> = {
            'SETTLED': 5,
            'PAID': 4,
            'PENDING': 3,
            'EXPIRED': 2,
            'FAILED': 1,
        };

        const deduplicatedPayments = (payments || []).reduce((acc, payment) => {
            const invoiceId = payment.xendit_invoice_id || payment.id;
            const existing = acc.get(invoiceId);

            if (!existing) {
                acc.set(invoiceId, payment);
            } else {
                // Keep the payment with higher status priority, or newer if same priority
                const existingPriority = statusPriority[existing.status] || 0;
                const currentPriority = statusPriority[payment.status] || 0;

                if (currentPriority > existingPriority) {
                    acc.set(invoiceId, payment);
                } else if (currentPriority === existingPriority) {
                    // Same priority - keep the newer one
                    const existingDate = new Date(existing.updated_at || existing.created_at).getTime();
                    const currentDate = new Date(payment.updated_at || payment.created_at).getTime();
                    if (currentDate > existingDate) {
                        acc.set(invoiceId, payment);
                    }
                }
            }
            return acc;
        }, new Map<string, NonNullable<typeof payments>[0]>());

        const uniquePayments = Array.from(deduplicatedPayments.values());

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const paymentsWithDetails = uniquePayments.map((p: any) => {
            const booth = p.booth as { name: string; organization: { name: string } | null } | null;
            return {
                ...p,
                booth_name: booth?.name || 'Unknown Booth',
                organization_name: booth?.organization?.name || 'Unknown Org',
            };
        });

        // Recalculate count for deduplicated results
        const actualTotal = paymentsWithDetails.length;

        return NextResponse.json({
            data: paymentsWithDetails,
            total: actualTotal,
            page,
            pageSize,
            totalPages: Math.ceil(actualTotal / pageSize) || 1,
        });
    } catch (error) {
        console.error('Payments API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
