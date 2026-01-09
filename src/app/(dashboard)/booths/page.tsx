"use client";

import { useEffect, useState } from "react";
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
    IconSettings,
    IconPower,
    IconTrash,
    IconRefresh,
    IconWifi,
    IconWifiOff,
    IconFilter,
    IconChevronLeft,
    IconChevronRight,
    IconLoader2,
} from "@tabler/icons-react";

interface Booth {
    id: string;
    name: string | null;
    location: string | null;
    status: string;
    is_online: boolean;
    price: number | null;
    organization_name: string;
    last_heartbeat: string | null;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);
}

function formatRelativeTime(dateStr: string | null): string {
    if (!dateStr) return "Never";
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

export default function BoothsPage() {
    const [booths, setBooths] = useState<Booth[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        async function fetchBooths() {
            setLoading(true);
            try {
                const params = new URLSearchParams({
                    page: page.toString(),
                    pageSize: "10",
                });
                const res = await fetch(`/api/admin/booths?${params}`);
                if (!res.ok) throw new Error("Failed to fetch");
                const data = await res.json();
                setBooths(data.data || []);
                setTotalPages(data.totalPages || 1);
            } catch (error) {
                console.error("Error fetching booths:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchBooths();
    }, [page]);

    const onlineCount = booths.filter(b => b.is_online).length;
    const activeCount = booths.filter(b => b.status === 'active').length;

    // Filter locally for search
    const filteredBooths = booths.filter(booth => {
        const matchesSearch = !searchQuery ||
            booth.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            booth.organization_name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" ||
            (statusFilter === "online" && booth.is_online) ||
            (statusFilter === "offline" && !booth.is_online) ||
            (statusFilter === "active" && booth.status === "active") ||
            (statusFilter === "inactive" && booth.status === "inactive");
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Booths</h1>
                    <p className="text-muted-foreground">
                        Monitor and manage all platform booths
                    </p>
                </div>
                <Button variant="outline" onClick={() => window.location.reload()}>
                    <IconRefresh className="mr-2 h-4 w-4" />
                    Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Booths</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{booths.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Online Now</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">{onlineCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Offline</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">{booths.length - onlineCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Active</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeCount}</div>
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
                                placeholder="Search booths..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[140px]">
                                <IconFilter className="mr-2 h-4 w-4" />
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="online">Online</SelectItem>
                                <SelectItem value="offline">Offline</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
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
                                    <TableHead>Booth</TableHead>
                                    <TableHead>Organization</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Connection</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Last Seen</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredBooths.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            No booths found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredBooths.map((booth) => (
                                        <TableRow key={booth.id}>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{booth.name || "Unnamed"}</div>
                                                    <div className="text-sm text-muted-foreground">{booth.location}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {booth.organization_name}
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge status={booth.status as "active" | "inactive"} />
                                            </TableCell>
                                            <TableCell>
                                                {booth.is_online ? (
                                                    <div className="flex items-center gap-2 text-green-500">
                                                        <IconWifi className="h-4 w-4" />
                                                        <span className="text-sm">Online</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-red-500">
                                                        <IconWifiOff className="h-4 w-4" />
                                                        <span className="text-sm">Offline</span>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {booth.price ? formatCurrency(booth.price) : "-"}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {formatRelativeTime(booth.last_heartbeat)}
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
                                                        <DropdownMenuItem>
                                                            <IconEye className="mr-2 h-4 w-4" />
                                                            View Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <IconSettings className="mr-2 h-4 w-4" />
                                                            Configure
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <IconPower className="mr-2 h-4 w-4" />
                                                            {booth.status === "active" ? "Deactivate" : "Activate"}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-red-500">
                                                            <IconTrash className="mr-2 h-4 w-4" />
                                                            Delete
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
