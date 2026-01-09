"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    IconCheck,
    IconX,
    IconLoader2,
    IconCurrencyDollar,
    IconClock,
} from "@tabler/icons-react";

interface Withdrawal {
    id: string;
    amount: number | null;
    fee: number | null;
    net_amount: number | null;
    status: string;
    bank_name: string | null;
    bank_account_number: string | null;
    bank_account_holder: string | null;
    user_name: string;
    user_email: string;
    organization_name: string;
    created_at: string | null;
    approved_at: string | null;
    rejection_reason: string | null;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);
}

function formatDateTime(dateStr: string | null): string {
    if (!dateStr) return "-";
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(dateStr));
}

function formatRelativeTime(dateStr: string | null): string {
    if (!dateStr) return "";
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
}

export default function WithdrawalsPage() {
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>("pending");
    const [processing, setProcessing] = useState<string | null>(null);
    const [rejectDialog, setRejectDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
    const [rejectReason, setRejectReason] = useState("");

    useEffect(() => {
        fetchWithdrawals();
    }, [statusFilter]);

    async function fetchWithdrawals() {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                status: statusFilter,
            });
            const res = await fetch(`/api/admin/withdrawals?${params}`);
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `HTTP ${res.status}`);
            }
            const data = await res.json();
            setWithdrawals(data.data || []);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to fetch";
            setError(message);
            console.error("Error fetching withdrawals:", err);
        } finally {
            setLoading(false);
        }
    }

    async function handleApprove(id: string) {
        setProcessing(id);
        try {
            const res = await fetch("/api/admin/withdrawals", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, action: "approve" }),
            });
            if (!res.ok) throw new Error("Failed to approve");
            fetchWithdrawals();
        } catch (error) {
            console.error("Error approving withdrawal:", error);
        } finally {
            setProcessing(null);
        }
    }

    async function handleReject() {
        if (!rejectDialog.id) return;
        setProcessing(rejectDialog.id);
        try {
            const res = await fetch("/api/admin/withdrawals", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: rejectDialog.id, action: "reject", reason: rejectReason }),
            });
            if (!res.ok) throw new Error("Failed to reject");
            setRejectDialog({ open: false, id: null });
            setRejectReason("");
            fetchWithdrawals();
        } catch (error) {
            console.error("Error rejecting withdrawal:", error);
        } finally {
            setProcessing(null);
        }
    }

    const pendingCount = withdrawals.filter(w => w.status === 'pending').length;
    const pendingTotal = withdrawals
        .filter(w => w.status === 'pending')
        .reduce((sum, w) => sum + (w.amount || 0), 0);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Withdrawals</h1>
                <p className="text-muted-foreground">
                    Process user withdrawal requests
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="border-yellow-500/50 bg-gradient-to-br from-yellow-500/10 to-orange-500/10">
                    <CardHeader className="pb-2">
                        <CardDescription>Pending Requests</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-500">{pendingCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Pending Amount</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(pendingTotal)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Approved (Page)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">
                            {withdrawals.filter(w => w.status === 'approved' || w.status === 'completed').length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Rejected (Page)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">
                            {withdrawals.filter(w => w.status === 'rejected').length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                <TabsList>
                    <TabsTrigger value="pending">
                        Pending
                        {pendingCount > 0 && (
                            <Badge variant="secondary" className="ml-2 bg-yellow-500/20 text-yellow-500">
                                {pendingCount}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="approved">Approved</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected</TabsTrigger>
                    <TabsTrigger value="all">All</TabsTrigger>
                </TabsList>

                <TabsContent value={statusFilter} className="mt-4">
                    <Card>
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="flex justify-center py-10">
                                    <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : error ? (
                                <div className="flex flex-col items-center justify-center py-10 gap-4">
                                    <p className="text-red-500">{error}</p>
                                    <Button variant="outline" onClick={fetchWithdrawals}>Retry</Button>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>Bank Details</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Requested</TableHead>
                                            {statusFilter === "pending" && (
                                                <TableHead className="text-right">Actions</TableHead>
                                            )}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {withdrawals.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                    No withdrawals found
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            withdrawals.map((withdrawal) => (
                                                <TableRow key={withdrawal.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <Avatar>
                                                                <AvatarFallback>
                                                                    {withdrawal.user_name?.split(" ").map(n => n[0]).join("") || "?"}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <div className="font-medium">{withdrawal.user_name}</div>
                                                                <div className="text-sm text-muted-foreground">
                                                                    {withdrawal.organization_name}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-sm">
                                                            <div className="font-medium">{withdrawal.bank_name}</div>
                                                            <div className="text-muted-foreground">
                                                                {withdrawal.bank_account_number} • {withdrawal.bank_account_holder}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="font-semibold">
                                                            {formatCurrency(withdrawal.amount || 0)}
                                                        </div>
                                                        {withdrawal.fee && (
                                                            <div className="text-xs text-muted-foreground">
                                                                Fee: {formatCurrency(withdrawal.fee)}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <StatusBadge status={withdrawal.status as "pending" | "approved" | "rejected" | "completed"} />
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        <div className="flex items-center gap-1">
                                                            <IconClock className="h-3 w-3" />
                                                            {formatRelativeTime(withdrawal.created_at)}
                                                        </div>
                                                    </TableCell>
                                                    {statusFilter === "pending" && (
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => setRejectDialog({ open: true, id: withdrawal.id })}
                                                                    disabled={processing === withdrawal.id}
                                                                >
                                                                    <IconX className="h-4 w-4 mr-1" />
                                                                    Reject
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    className="bg-green-600 hover:bg-green-700"
                                                                    onClick={() => handleApprove(withdrawal.id)}
                                                                    disabled={processing === withdrawal.id}
                                                                >
                                                                    {processing === withdrawal.id ? (
                                                                        <IconLoader2 className="h-4 w-4 animate-spin" />
                                                                    ) : (
                                                                        <>
                                                                            <IconCheck className="h-4 w-4 mr-1" />
                                                                            Approve
                                                                        </>
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Reject Dialog */}
            <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ open, id: open ? rejectDialog.id : null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Withdrawal</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this withdrawal request.
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        placeholder="Rejection reason..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialog({ open: false, id: null })}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleReject} disabled={!rejectReason || processing !== null}>
                            {processing ? <IconLoader2 className="h-4 w-4 animate-spin" /> : "Reject"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
