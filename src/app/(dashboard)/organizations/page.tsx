"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    IconSearch,
    IconDotsVertical,
    IconEye,
    IconEdit,
    IconBan,
    IconPlus,
    IconArrowUp,
    IconArrowDown,
    IconDownload,
    IconFilter,
    IconChevronLeft,
    IconChevronRight,
    IconLoader2,
} from "@tabler/icons-react";
import type { Organization } from "@/types/database";

interface OrganizationWithStats extends Organization {
    booths_count: number;
    members_count: number;
    total_revenue: number;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);
}

function formatDate(dateStr: string | null): string {
    if (!dateStr) return "-";
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    }).format(new Date(dateStr));
}

export default function OrganizationsPage() {
    const [organizations, setOrganizations] = useState<OrganizationWithStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [planFilter, setPlanFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        async function fetchOrganizations() {
            setLoading(true);
            try {
                const params = new URLSearchParams({
                    page: page.toString(),
                    pageSize: "10",
                    search: searchQuery,
                    plan: planFilter,
                    status: statusFilter,
                });
                const res = await fetch(`/api/admin/organizations?${params}`);
                if (!res.ok) throw new Error("Failed to fetch");
                const data = await res.json();
                setOrganizations(data.data || []);
                setTotalPages(data.totalPages || 1);
            } catch (error) {
                console.error("Error fetching organizations:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchOrganizations();
    }, [page, searchQuery, planFilter, statusFilter]);

    // Debounce search
    const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, planFilter, statusFilter]);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
                    <p className="text-muted-foreground">
                        Manage platform organizations and their subscriptions
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline">
                        <IconDownload className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Organizations</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{organizations.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Basic Plan</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-400">
                            {organizations.filter(o => o.subscription_plan === 'basic').length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Pro Plan</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-violet-500">
                            {organizations.filter(o => o.subscription_plan === 'pro').length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Active Subscriptions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">
                            {organizations.filter(o => o.subscription_status === 'active').length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Table Card */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search organizations..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Select value={planFilter} onValueChange={setPlanFilter}>
                                <SelectTrigger className="w-[130px]">
                                    <IconFilter className="mr-2 h-4 w-4" />
                                    <SelectValue placeholder="Plan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Plans</SelectItem>
                                    <SelectItem value="basic">Basic</SelectItem>
                                    <SelectItem value="pro">Pro</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                    <SelectItem value="expired">Expired</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
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
                                    <TableHead>Organization</TableHead>
                                    <TableHead>Plan</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-center">Booths</TableHead>
                                    <TableHead className="text-center">Members</TableHead>
                                    <TableHead className="text-right">Revenue</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {organizations.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                            No organizations found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    organizations.map((org) => (
                                        <TableRow key={org.id} className="cursor-pointer hover:bg-accent/50">
                                            <TableCell>
                                                <Link href={`/organizations/${org.id}`} className="block">
                                                    <div className="font-medium">{org.name}</div>
                                                    <div className="text-sm text-muted-foreground">/{org.slug}</div>
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge status={org.subscription_plan} />
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge status={org.subscription_status} />
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {org.booths_count}/{org.max_booths}
                                            </TableCell>
                                            <TableCell className="text-center">{org.members_count}</TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatCurrency(org.total_revenue || 0)}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {formatDate(org.created_at)}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <IconDotsVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/organizations/${org.id}`}>
                                                                <IconEye className="mr-2 h-4 w-4" />
                                                                View Details
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <IconEdit className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <IconArrowUp className="mr-2 h-4 w-4" />
                                                            Upgrade Plan
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-red-500">
                                                            <IconBan className="mr-2 h-4 w-4" />
                                                            Suspend
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
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
