"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    IconLoader2,
    IconPlus,
    IconSend,
    IconTrash,
    IconArchive,
    IconMegaphone,
    IconAlertCircle,
    IconInfoCircle,
    IconTool,
    IconGift,
} from "@tabler/icons-react";

interface Broadcast {
    id: string;
    title: string;
    message: string;
    type: string;
    target_type: string;
    status: string;
    scheduled_at: string | null;
    sent_at: string | null;
    expires_at: string | null;
    created_at: string;
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
    info: { icon: IconInfoCircle, color: 'text-blue-500', label: 'Information' },
    warning: { icon: IconAlertCircle, color: 'text-yellow-500', label: 'Warning' },
    maintenance: { icon: IconTool, color: 'text-orange-500', label: 'Maintenance' },
    promotion: { icon: IconGift, color: 'text-green-500', label: 'Promotion' },
};

const STATUS_COLORS: Record<string, string> = {
    draft: 'bg-gray-500/20 text-gray-400',
    scheduled: 'bg-blue-500/20 text-blue-500',
    sent: 'bg-green-500/20 text-green-500',
    archived: 'bg-zinc-500/20 text-zinc-500',
};

function formatDateTime(dateStr: string | null): string {
    if (!dateStr) return '-';
    return new Intl.DateTimeFormat('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    }).format(new Date(dateStr));
}

export default function BroadcastsPage() {
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
    const [loading, setLoading] = useState(true);
    const [tableExists, setTableExists] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [processing, setProcessing] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState("all");

    // Form state
    const [form, setForm] = useState({
        title: '',
        message: '',
        type: 'info',
        target_type: 'all',
        scheduled_at: '',
        expires_at: '',
    });

    async function fetchBroadcasts() {
        try {
            const res = await fetch(`/api/admin/broadcasts?status=${statusFilter}`);
            const data = await res.json();
            setBroadcasts(data.data || []);
            setTableExists(data.tableExists !== false);
        } catch (error) {
            console.error('Error fetching broadcasts:', error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchBroadcasts();
    }, [statusFilter]);

    async function handleCreate() {
        setProcessing('create');
        try {
            const res = await fetch('/api/admin/broadcasts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            if (!res.ok) {
                const errorData = await res.json();
                console.error('API Error:', errorData);
                alert(`Failed to create: ${errorData.error || 'Unknown error'}`);
                throw new Error('Failed to create');
            }

            setDialogOpen(false);
            setForm({ title: '', message: '', type: 'info', target_type: 'all', scheduled_at: '', expires_at: '' });
            fetchBroadcasts();
        } catch (error) {
            console.error('Error creating broadcast:', error);
        } finally {
            setProcessing(null);
        }
    }

    async function handleSend(id: string) {
        setProcessing(id);
        try {
            const res = await fetch('/api/admin/broadcasts', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, action: 'send' }),
            });
            if (!res.ok) throw new Error('Failed to send');
            fetchBroadcasts();
        } catch (error) {
            console.error('Error sending broadcast:', error);
        } finally {
            setProcessing(null);
        }
    }

    async function handleArchive(id: string) {
        setProcessing(id);
        try {
            const res = await fetch('/api/admin/broadcasts', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, action: 'archive' }),
            });
            if (!res.ok) throw new Error('Failed to archive');
            fetchBroadcasts();
        } catch (error) {
            console.error('Error archiving broadcast:', error);
        } finally {
            setProcessing(null);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Delete this broadcast?')) return;
        setProcessing(id);
        try {
            const res = await fetch(`/api/admin/broadcasts?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            fetchBroadcasts();
        } catch (error) {
            console.error('Error deleting broadcast:', error);
        } finally {
            setProcessing(null);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Broadcasts</h1>
                    <p className="text-muted-foreground">Send announcements to booth operators</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <IconPlus className="mr-2 h-4 w-4" />
                            New Broadcast
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Create Broadcast</DialogTitle>
                            <DialogDescription>Send an announcement to booth operators</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Announcement title" />
                            </div>
                            <div className="space-y-2">
                                <Label>Message</Label>
                                <Textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Your message..." rows={4} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Type</Label>
                                    <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="info">Information</SelectItem>
                                            <SelectItem value="warning">Warning</SelectItem>
                                            <SelectItem value="maintenance">Maintenance</SelectItem>
                                            <SelectItem value="promotion">Promotion</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Target</Label>
                                    <Select value={form.target_type} onValueChange={v => setForm({ ...form, target_type: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Users</SelectItem>
                                            <SelectItem value="organization">Specific Orgs</SelectItem>
                                            <SelectItem value="plan">By Plan</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Expires At (Optional)</Label>
                                <Input type="datetime-local" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreate} disabled={!form.title || !form.message || processing === 'create'}>
                                {processing === 'create' ? <IconLoader2 className="h-4 w-4 animate-spin" /> : 'Create'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Table Not Exists Warning */}
            {!tableExists && (
                <Card className="border-yellow-500/50 bg-yellow-500/10">
                    <CardContent className="pt-6">
                        <p className="text-yellow-500">Run migration 007_advanced_features.sql to enable broadcasts.</p>
                    </CardContent>
                </Card>
            )}

            {/* Filters */}
            <div className="flex gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Broadcasts Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Type</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Target</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Sent/Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {broadcasts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No broadcasts found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                broadcasts.map((broadcast) => {
                                    const typeConfig = TYPE_CONFIG[broadcast.type] || TYPE_CONFIG.info;
                                    const TypeIcon = typeConfig.icon;
                                    return (
                                        <TableRow key={broadcast.id}>
                                            <TableCell>
                                                <TypeIcon className={`h-5 w-5 ${typeConfig.color}`} />
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{broadcast.title}</div>
                                                <div className="text-sm text-muted-foreground truncate max-w-[300px]">{broadcast.message}</div>
                                            </TableCell>
                                            <TableCell className="capitalize">{broadcast.target_type}</TableCell>
                                            <TableCell>
                                                <Badge className={STATUS_COLORS[broadcast.status]}>{broadcast.status}</Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {formatDateTime(broadcast.sent_at || broadcast.created_at)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    {broadcast.status === 'draft' && (
                                                        <Button size="sm" onClick={() => handleSend(broadcast.id)} disabled={processing === broadcast.id}>
                                                            <IconSend className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {broadcast.status === 'sent' && (
                                                        <Button size="sm" variant="outline" onClick={() => handleArchive(broadcast.id)} disabled={processing === broadcast.id}>
                                                            <IconArchive className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    <Button size="sm" variant="destructive" onClick={() => handleDelete(broadcast.id)} disabled={processing === broadcast.id}>
                                                        <IconTrash className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
