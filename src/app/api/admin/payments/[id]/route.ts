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

        // Fetch payment with booth and organization details
        const { data: payment, error } = await supabaseAdmin
            .from('payments')
            .select(`
                *,
                booth:booths(
                    id,
                    name,
                    location,
                    organization:organizations(id, name, slug)
                )
            `)
            .eq('id', id)
            .single();

        if (error || !payment) {
            return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
        }

        const booth = payment.booth as unknown as {
            id: string;
            name: string;
            location: string;
            organization: { id: string; name: string; slug: string } | null;
        } | null;

        return NextResponse.json({
            ...payment,
            booth_name: booth?.name || 'Unknown Booth',
            booth_location: booth?.location || '',
            organization_id: booth?.organization?.id,
            organization_name: booth?.organization?.name || 'Unknown',
            organization_slug: booth?.organization?.slug || '',
        });
    } catch (error) {
        console.error('Payment detail API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
