"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    IconLoader2,
    IconDotsVertical,
    IconCircle,
    IconCircleCheck,
    IconClock,
    IconAlertTriangle,
    IconMessageCircle,
} from "@tabler/icons-react";

interface Ticket {
    id: string;
    ticket_number: number;
    title: string;
    description: string;
    category: string;
    priority: string;
    status: string;
    user_name: string;
    organization_name: string;
    created_at: string;
    resolved_at: string | null;
}

const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
    low: { color: 'bg-gray-500/20 text-gray-400', label: 'Low' },
    medium: { color: 'bg-blue-500/20 text-blue-500', label: 'Medium' },
    high: { color: 'bg-orange-500/20 text-orange-500', label: 'High' },
    urgent: { color: 'bg-red-500/20 text-red-500', label: 'Urgent' },
};

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
    open: { icon: IconCircle, color: 'text-blue-500', label: 'Open' },
    in_progress: { icon: IconClock, color: 'text-yellow-500', label: 'In Progress' },
    waiting: { icon: IconClock, color: 'text-gray-500', label: 'Waiting' },
    resolved: { icon: IconCircleCheck, color: 'text-green-500', label: 'Resolved' },
    closed: { icon: IconCircleCheck, color: 'text-zinc-500', label: 'Closed' },
};

function formatRelativeTime(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
}

export default function SupportPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [stats, setStats] = useState({ open: 0, in_progress: 0, resolved: 0, urgent: 0 });
    const [loading, setLoading] = useState(true);
    const [tableExists, setTableExists] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [processing, setProcessing] = useState<string | null>(null);

    async function fetchTickets() {
        try {
            const params = new URLSearchParams({ status: statusFilter, priority: priorityFilter });
            const res = await fetch(`/api/admin/tickets?${params}`);
            const data = await res.json();
            setTickets(data.data || []);
            setStats(data.stats || { open: 0, in_progress: 0, resolved: 0, urgent: 0 });
            setTableExists(data.tableExists !== false);
        } catch (error) {
            console.error('Error fetching tickets:', error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchTickets();
    }, [statusFilter, priorityFilter]);

    async function updateTicket(id: string, updates: Record<string, string>) {
        setProcessing(id);
        try {
            const res = await fetch('/api/admin/tickets', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...updates }),
            });
            if (!res.ok) throw new Error('Failed to update');
            fetchTickets();
        } catch (error) {
            console.error('Error updating ticket:', error);
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
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Support Tickets</h1>
                <p className="text-muted-foreground">Manage customer support requests</p>
            </div>

            {/* Table Not Exists Warning */}
            {!tableExists && (
                <Card className="border-yellow-500/50 bg-yellow-500/10">
                    <CardContent className="pt-6">
                        <p className="text-yellow-500">Run migration 007_advanced_features.sql to enable support tickets.</p>
                    </CardContent>
                </Card>
            )}

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="border-blue-500/30">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <IconCircle className="h-5 w-5 text-blue-500" />
                            <div>
                                <div className="text-2xl font-bold">{stats.open}</div>
                                <div className="text-sm text-muted-foreground">Open</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-yellow-500/30">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <IconClock className="h-5 w-5 text-yellow-500" />
                            <div>
                                <div className="text-2xl font-bold">{stats.in_progress}</div>
                                <div className="text-sm text-muted-foreground">In Progress</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-green-500/30">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <IconCircleCheck className="h-5 w-5 text-green-500" />
                            <div>
                                <div className="text-2xl font-bold">{stats.resolved}</div>
                                <div className="text-sm text-muted-foreground">Resolved</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-red-500/30">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <IconAlertTriangle className="h-5 w-5 text-red-500" />
                            <div>
                                <div className="text-2xl font-bold">{stats.urgent}</div>
                                <div className="text-sm text-muted-foreground">High Priority</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="waiting">Waiting</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Priority</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Tickets Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>#</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead>From</TableHead>
                                <TableHead>Priority</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tickets.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        No tickets found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                tickets.map((ticket) => {
                                    const priorityConfig = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.medium;
                                    const statusConfig = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
                                    const StatusIcon = statusConfig.icon;
                                    return (
                                        <TableRow key={ticket.id}>
                                            <TableCell className="font-mono">#{ticket.ticket_number}</TableCell>
                                            <TableCell>
                                                <div className="font-medium">{ticket.title}</div>
                                                <div className="text-sm text-muted-foreground truncate max-w-[250px]">{ticket.description}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{ticket.user_name}</div>
                                                <div className="text-sm text-muted-foreground">{ticket.organization_name}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={priorityConfig.color}>{priorityConfig.label}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
                                                    <span>{statusConfig.label}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {formatRelativeTime(ticket.created_at)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" disabled={processing === ticket.id}>
                                                            {processing === ticket.id ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <IconDotsVertical className="h-4 w-4" />}
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => updateTicket(ticket.id, { status: 'in_progress' })}>Mark In Progress</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => updateTicket(ticket.id, { status: 'resolved' })}>Mark Resolved</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => updateTicket(ticket.id, { status: 'closed' })}>Close Ticket</DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuLabel>Change Priority</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => updateTicket(ticket.id, { priority: 'urgent' })}>Set Urgent</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => updateTicket(ticket.id, { priority: 'low' })}>Set Low</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
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
