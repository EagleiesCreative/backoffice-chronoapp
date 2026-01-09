"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
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
    IconSearch,
    IconDownload,
    IconFilter,
    IconChevronLeft,
    IconChevronRight,
    IconLoader2,
} from "@tabler/icons-react";

interface Payment {
    id: string;
    amount: number | null;
    status: string;
    payment_method: string | null;
    xendit_invoice_id: string | null;
    booth_name: string;
    organization_name: string;
    created_at: string | null;
    paid_at: string | null;
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

export default function PaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        async function fetchPayments() {
            setLoading(true);
            try {
                const params = new URLSearchParams({
                    page: page.toString(),
                    pageSize: "15",
                    status: statusFilter,
                });
                const res = await fetch(`/api/admin/payments?${params}`);
                if (!res.ok) throw new Error("Failed to fetch");
                const data = await res.json();
                setPayments(data.data || []);
                setTotalPages(data.totalPages || 1);
            } catch (error) {
                console.error("Error fetching payments:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchPayments();
    }, [page, statusFilter]);

    // Calculate stats
    const totalRevenue = payments
        .filter(p => p.status === 'PAID' || p.status === 'SETTLED')
        .reduce((sum, p) => sum + (p.amount || 0), 0);

    const filteredPayments = payments.filter(p =>
        !searchQuery ||
        p.booth_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.organization_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.xendit_invoice_id?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
                    <p className="text-muted-foreground">
                        View all platform payment transactions
                    </p>
                </div>
                <Button variant="outline">
                    <IconDownload className="mr-2 h-4 w-4" />
                    Export
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Transactions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{payments.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Paid</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">
                            {payments.filter(p => p.status === 'PAID' || p.status === 'SETTLED').length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Pending</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-500">
                            {payments.filter(p => p.status === 'PENDING').length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Revenue (Page)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters & Table */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by booth, org, or invoice ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                            <SelectTrigger className="w-[140px]">
                                <IconFilter className="mr-2 h-4 w-4" />
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="PAID">Paid</SelectItem>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="SETTLED">Settled</SelectItem>
                                <SelectItem value="EXPIRED">Expired</SelectItem>
                                <SelectItem value="FAILED">Failed</SelectItem>
                            </SelectContent>
                        </Select>
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
                                    <TableHead>Invoice ID</TableHead>
                                    <TableHead>Booth</TableHead>
                                    <TableHead>Organization</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead>Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPayments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            No payments found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredPayments.map((payment) => (
                                        <TableRow key={payment.id} className="cursor-pointer hover:bg-accent/50">
                                            <TableCell className="font-mono text-sm">
                                                <Link href={`/payments/${payment.id}`} className="hover:underline text-violet-500">
                                                    {payment.xendit_invoice_id || payment.id.slice(0, 8)}
                                                </Link>
                                            </TableCell>
                                            <TableCell>{payment.booth_name}</TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {payment.organization_name}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {payment.amount ? formatCurrency(payment.amount) : "-"}
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge status={payment.status as "PAID" | "PENDING" | "SETTLED" | "EXPIRED" | "FAILED"} />
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {payment.payment_method || "-"}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {formatDateTime(payment.paid_at || payment.created_at)}
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
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
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
                        disabled={page >= totalPages}
                        onClick={() => setPage(p => p + 1)}
                    >
                        <IconChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
