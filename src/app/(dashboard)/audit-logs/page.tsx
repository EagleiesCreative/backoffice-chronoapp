"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    IconLoader2,
    IconRefresh,
    IconChevronLeft,
    IconChevronRight,
    IconUser,
    IconBuilding,
    IconDeviceDesktop,
    IconCreditCard,
    IconCash,
    IconSettings,
    IconAlertCircle,
} from "@tabler/icons-react";

interface AuditLog {
    id: string;
    actor_id: string | null;
    actor_name: string;
    actor_email: string;
    action_type: string;
    entity_type: string;
    entity_id: string;
    description: string;
    metadata: Record<string, unknown>;
    ip_address: string | null;
    created_at: string;
}

interface AuditData {
    data: AuditLog[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    tableExists: boolean;
    message?: string;
}

function formatDateTime(dateStr: string): string {
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    }).format(new Date(dateStr));
}

function formatRelativeTime(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    if (diffSecs < 60) return `${diffSecs}s ago`;
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
}

function ActionIcon({ type }: { type: string }) {
    switch (type) {
        case 'user': return <IconUser className="h-4 w-4" />;
        case 'organization': return <IconBuilding className="h-4 w-4" />;
        case 'booth': return <IconDeviceDesktop className="h-4 w-4" />;
        case 'payment': return <IconCreditCard className="h-4 w-4" />;
        case 'withdrawal': return <IconCash className="h-4 w-4" />;
        default: return <IconSettings className="h-4 w-4" />;
    }
}

function ActionBadge({ action }: { action: string }) {
    const colors: Record<string, string> = {
        create: 'bg-green-500/20 text-green-500',
        update: 'bg-blue-500/20 text-blue-500',
        delete: 'bg-red-500/20 text-red-500',
        approve: 'bg-emerald-500/20 text-emerald-500',
        reject: 'bg-orange-500/20 text-orange-500',
        login: 'bg-violet-500/20 text-violet-500',
    };
    return (
        <Badge className={colors[action] || 'bg-gray-500/20 text-gray-400'}>
            {action.toUpperCase()}
        </Badge>
    );
}

export default function AuditLogsPage() {
    const [data, setData] = useState<AuditData | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [typeFilter, setTypeFilter] = useState("all");
    const [entityFilter, setEntityFilter] = useState("all");

    async function fetchLogs() {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                pageSize: "30",
                type: typeFilter,
                entity: entityFilter,
            });
            const res = await fetch(`/api/admin/audit-logs?${params}`);
            if (!res.ok) throw new Error("Failed to fetch");
            const json = await res.json();
            setData(json);
        } catch (error) {
            console.error("Error fetching audit logs:", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchLogs();
    }, [page, typeFilter, entityFilter]);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
                    <p className="text-muted-foreground">
                        Track all administrative actions and system events
                    </p>
                </div>
                <Button variant="outline" onClick={fetchLogs}>
                    <IconRefresh className="mr-2 h-4 w-4" />
                    Refresh
                </Button>
            </div>

            {/* Table Not Exists Warning */}
            {data && !data.tableExists && (
                <Card className="border-yellow-500/50 bg-yellow-500/10">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <IconAlertCircle className="h-5 w-5 text-yellow-500" />
                            <div>
                                <p className="font-medium text-yellow-500">Audit Logs Table Not Found</p>
                                <p className="text-sm text-muted-foreground">
                                    Run the migration to create the audit_logs table for full functionality.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Filters */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Action Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Actions</SelectItem>
                                <SelectItem value="create">Create</SelectItem>
                                <SelectItem value="update">Update</SelectItem>
                                <SelectItem value="delete">Delete</SelectItem>
                                <SelectItem value="approve">Approve</SelectItem>
                                <SelectItem value="reject">Reject</SelectItem>
                                <SelectItem value="login">Login</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={entityFilter} onValueChange={(v) => { setEntityFilter(v); setPage(1); }}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Entity Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Entities</SelectItem>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="organization">Organization</SelectItem>
                                <SelectItem value="booth">Booth</SelectItem>
                                <SelectItem value="payment">Payment</SelectItem>
                                <SelectItem value="withdrawal">Withdrawal</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="flex-1" />
                        <p className="text-sm text-muted-foreground self-center">
                            {data?.total || 0} total logs
                        </p>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[180px]">Timestamp</TableHead>
                                    <TableHead>Actor</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Entity</TableHead>
                                    <TableHead>Description</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(!data?.data || data.data.length === 0) ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            No audit logs found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.data.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell>
                                                <div className="text-sm">{formatRelativeTime(log.created_at)}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {formatDateTime(log.created_at)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{log.actor_name}</div>
                                                {log.actor_email && (
                                                    <div className="text-xs text-muted-foreground">{log.actor_email}</div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <ActionBadge action={log.action_type} />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <ActionIcon type={log.entity_type} />
                                                    <span className="capitalize">{log.entity_type}</span>
                                                </div>
                                                <div className="text-xs text-muted-foreground font-mono">
                                                    {log.entity_id?.slice(0, 8)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-[300px] truncate">
                                                {log.description}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Pagination */}
            {data && data.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Page {page} of {data.totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                        >
                            <IconChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="min-w-[40px]">
                            {page}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= data.totalPages}
                            onClick={() => setPage(p => p + 1)}
                        >
                            <IconChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
