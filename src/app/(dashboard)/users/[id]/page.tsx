"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    IconArrowLeft,
    IconEdit,
    IconMail,
    IconBuilding,
    IconCash,
    IconLoader2,
} from "@tabler/icons-react";

interface UserDetail {
    id: string;
    name: string | null;
    email: string | null;
    image_url: string | null;
    created_at: string | null;
    updated_at: string | null;
    organizations: Organization[];
    withdrawals: Withdrawal[];
    total_withdrawn: number;
    organization_count: number;
}

interface Organization {
    id: string;
    name: string;
    slug: string;
    subscription_plan: string;
    role: string;
    revenue_share: number;
    bank_name: string | null;
    bank_account_number: string | null;
    bank_account_holder: string | null;
    joined_at: string | null;
}

interface Withdrawal {
    id: string;
    amount: number | null;
    fee: number | null;
    net_amount: number | null;
    status: string;
    bank_name: string | null;
    bank_account_number: string | null;
    organization_name: string;
    created_at: string | null;
    completed_at: string | null;
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

export default function UserDetailPage() {
    const params = useParams();
    const userId = params.id as string;
    const [data, setData] = useState<UserDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchUser() {
            try {
                const res = await fetch(`/api/admin/users/${userId}`);
                if (!res.ok) throw new Error("Failed to fetch user");
                const json = await res.json();
                setData(json);
            } catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred");
            } finally {
                setLoading(false);
            }
        }
        if (userId) fetchUser();
    }, [userId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <p className="text-red-500">{error || "User not found"}</p>
                <Link href="/users">
                    <Button>Back to Users</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/users">
                    <Button variant="ghost" size="icon">
                        <IconArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <Avatar className="h-16 w-16">
                    <AvatarImage src={data.image_url || undefined} />
                    <AvatarFallback className="text-xl">
                        {data.name?.split(" ").map(n => n[0]).join("") || "?"}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold tracking-tight">{data.name || "Unnamed User"}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <IconMail className="h-4 w-4" />
                        {data.email}
                    </div>
                </div>
                <Button variant="outline">
                    <IconEdit className="mr-2 h-4 w-4" />
                    Edit User
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Organizations</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.organization_count}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Withdrawals</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.withdrawals.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Withdrawn</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(data.total_withdrawn)}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="organizations">Organizations</TabsTrigger>
                    <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 lg:grid-cols-2">
                        {/* User Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle>User Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">User ID</span>
                                    <span className="font-mono text-sm">{data.id}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Email</span>
                                    <span>{data.email}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Created</span>
                                    <span>{formatDate(data.created_at)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Updated</span>
                                    <span>{formatDate(data.updated_at)}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Organizations Summary */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Organizations</CardTitle>
                                <CardDescription>{data.organizations.length} memberships</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {data.organizations.length === 0 ? (
                                    <p className="text-muted-foreground">No organizations</p>
                                ) : (
                                    data.organizations.slice(0, 3).map(org => (
                                        <div key={org.id} className="flex items-center justify-between p-3 rounded-lg border">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-accent">
                                                    <IconBuilding className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <div className="font-medium">{org.name}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {org.revenue_share}% revenue share
                                                    </div>
                                                </div>
                                            </div>
                                            <Badge variant={org.role === "org:admin" ? "default" : "secondary"}>
                                                {org.role === "org:admin" ? "Admin" : "Member"}
                                            </Badge>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="organizations">
                    <Card>
                        <CardHeader>
                            <CardTitle>Organization Memberships</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Organization</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Revenue Share</TableHead>
                                        <TableHead>Bank Details</TableHead>
                                        <TableHead>Joined</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.organizations.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                No organizations
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        data.organizations.map(org => (
                                            <TableRow key={org.id}>
                                                <TableCell>
                                                    <Link href={`/organizations/${org.id}`} className="block">
                                                        <div className="font-medium">{org.name}</div>
                                                        <div className="text-sm text-muted-foreground">/{org.slug}</div>
                                                    </Link>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={org.role === "org:admin" ? "default" : "secondary"}>
                                                        {org.role === "org:admin" ? "Admin" : "Member"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{org.revenue_share}%</TableCell>
                                                <TableCell>
                                                    {org.bank_name ? (
                                                        <div className="text-sm">
                                                            <div>{org.bank_name}</div>
                                                            <div className="text-muted-foreground">{org.bank_account_number}</div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">Not set</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {formatDate(org.joined_at)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="withdrawals">
                    <Card>
                        <CardHeader>
                            <CardTitle>Withdrawal History</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Organization</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Fee</TableHead>
                                        <TableHead>Net</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Bank</TableHead>
                                        <TableHead>Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.withdrawals.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                No withdrawals
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        data.withdrawals.map(w => (
                                            <TableRow key={w.id}>
                                                <TableCell>{w.organization_name}</TableCell>
                                                <TableCell>{formatCurrency(w.amount || 0)}</TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {formatCurrency(w.fee || 0)}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {formatCurrency(w.net_amount || 0)}
                                                </TableCell>
                                                <TableCell>
                                                    <StatusBadge status={w.status as "pending" | "approved" | "completed" | "rejected"} />
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {w.bank_name || "-"}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {formatDateTime(w.created_at)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
