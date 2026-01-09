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

        let query = supabaseAdmin
            .from('broadcasts')
            .select('*')
            .order('created_at', { ascending: false });

        if (status !== 'all') {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) {
            if (error.code === '42P01') {
                return NextResponse.json({
                    data: [],
                    tableExists: false,
                    message: 'Run migration 007_advanced_features.sql to enable this feature'
                });
            }
            throw error;
        }

        return NextResponse.json({ data, tableExists: true });
    } catch (error) {
        console.error('Broadcasts API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { title, message, type, target_type } = body;

        if (!title || !message) {
            return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
        }

        console.log('Creating broadcast with data:', {
            subject: title,
            message,
            priority: type === 'urgent' ? 'high' : type === 'warning' ? 'medium' : 'low',
            sender_id: userId,
        });

        // Try to get user's organization (optional for B2C standalone users)
        let organizationId: string | null = null;
        const { data: membership } = await supabaseAdmin
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', userId)
            .limit(1)
            .single();

        if (membership) {
            organizationId = membership.organization_id;
        }
        // If no organization, that's fine - B2C standalone users don't need one

        // Map to existing schema
        const { data, error } = await supabaseAdmin
            .from('broadcasts')
            .insert({
                subject: title,
                message,
                priority: type === 'urgent' ? 'high' : type === 'warning' ? 'medium' : 'low',
                sender_id: userId,
                organization_id: organizationId,
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase insert error:', error);
            return NextResponse.json({
                error: `Database error: ${error.message}`,
                details: error
            }, { status: 500 });
        }

        console.log('Broadcast created successfully:', data);
        return NextResponse.json(data);
    } catch (error) {
        console.error('Create broadcast error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({
            error: `Failed to create broadcast: ${errorMessage}`,
            stack: error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, priority } = body;

        if (!id) {
            return NextResponse.json({ error: 'Broadcast ID required' }, { status: 400 });
        }

        const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (priority) updateData.priority = priority;

        const { data, error } = await supabaseAdmin
            .from('broadcasts')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        console.error('Update broadcast error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Broadcast ID required' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('broadcasts')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete broadcast error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
