"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import { MetricCard } from "@/components/metric-card";
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    IconArrowLeft,
    IconEdit,
    IconDotsVertical,
    IconCurrencyDollar,
    IconDeviceDesktop,
    IconUsers,
    IconCreditCard,
    IconArrowUp,
    IconBan,
    IconTrash,
    IconWifi,
    IconWifiOff,
    IconCalendar,
    IconMail,
    IconLoader2,
} from "@tabler/icons-react";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";

interface OrganizationDetail {
    id: string;
    name: string | null;
    slug: string | null;
    subscription_plan: string;
    subscription_status: string;
    subscription_expires_at: string | null;
    max_booths: number;
    created_at: string | null;
    updated_at: string | null;
    members: Member[];
    booths: Booth[];
    payments: Payment[];
    total_revenue: number;
    revenue_chart: { date: string; amount: number }[];
}

interface Member {
    id: string;
    user_id: string;
    name: string;
    email: string;
    image_url: string | null;
    role: string;
    revenue_share: number;
    created_at: string | null;
}

interface Booth {
    id: string;
    name: string | null;
    location: string | null;
    status: string;
    is_online: boolean;
    price: number | null;
    last_heartbeat: string | null;
}

interface Payment {
    id: string;
    amount: number;
    status: string;
    booth_name: string;
    created_at: string | null;
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
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(dateStr));
}

export default function OrganizationDetailPage() {
    const params = useParams();
    const orgId = params.id as string;
    const [data, setData] = useState<OrganizationDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchOrganization() {
            try {
                const res = await fetch(`/api/admin/organizations/${orgId}`);
                if (!res.ok) throw new Error("Failed to fetch organization");
                const json = await res.json();
                setData(json);
            } catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred");
            } finally {
                setLoading(false);
            }
        }
        if (orgId) fetchOrganization();
    }, [orgId]);

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
                <p className="text-red-500">{error || "Organization not found"}</p>
                <Link href="/organizations">
                    <Button>Back to Organizations</Button>
                </Link>
            </div>
        );
    }

    const onlineBooths = data.booths.filter(b => b.is_online).length;
    const activeBooths = data.booths.filter(b => b.status === 'active').length;

    return (
        <div className="space-y-6">
            {/* Breadcrumb and Actions */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/organizations">
                        <Button variant="ghost" size="icon">
                            <IconArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight">{data.name}</h1>
                            <StatusBadge status={data.subscription_plan as "basic" | "pro"} />
                            <StatusBadge status={data.subscription_status as "active" | "cancelled" | "expired"} />
                        </div>
                        <p className="text-muted-foreground">/{data.slug}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline">
                        <IconEdit className="mr-2 h-4 w-4" />
                        Edit
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                                <IconDotsVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Subscription</DropdownMenuLabel>
                            <DropdownMenuItem>
                                <IconArrowUp className="mr-2 h-4 w-4" />
                                Upgrade to Pro
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <IconCalendar className="mr-2 h-4 w-4" />
                                Extend Expiry
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <IconBan className="mr-2 h-4 w-4" />
                                Suspend
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-500">
                                <IconTrash className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid gap-4 md:grid-cols-4">
                <MetricCard
                    title="Total Revenue"
                    value={formatCurrency(data.total_revenue)}
                    icon={<IconCurrencyDollar className="h-5 w-5" />}
                />
                <MetricCard
                    title="Active Booths"
                    value={`${activeBooths}/${data.max_booths}`}
                    icon={<IconDeviceDesktop className="h-5 w-5" />}
                    description={`${onlineBooths} online now`}
                />
                <MetricCard
                    title="Team Members"
                    value={data.members.length.toString()}
                    icon={<IconUsers className="h-5 w-5" />}
                />
                <MetricCard
                    title="Recent Payments"
                    value={data.payments.length.toString()}
                    icon={<IconCreditCard className="h-5 w-5" />}
                />
            </div>

            {/* Tabs Content */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="members">Members</TabsTrigger>
                    <TabsTrigger value="booths">Booths</TabsTrigger>
                    <TabsTrigger value="payments">Payments</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 lg:grid-cols-5">
                        {/* Revenue Chart */}
                        <Card className="lg:col-span-3">
                            <CardHeader>
                                <CardTitle>Revenue Trend</CardTitle>
                                <CardDescription>Monthly revenue for this organization</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={data.revenue_chart}>
                                            <defs>
                                                <linearGradient id="colorOrgRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                            <XAxis dataKey="date" stroke="#666" fontSize={12} />
                                            <YAxis
                                                stroke="#666"
                                                fontSize={12}
                                                tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: "#1e1e2e",
                                                    border: "1px solid #333",
                                                    borderRadius: "8px",
                                                }}
                                                formatter={(value) => value != null ? [formatCurrency(Number(value)), "Revenue"] : ['', "Revenue"]}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="amount"
                                                stroke="#8b5cf6"
                                                strokeWidth={2}
                                                fill="url(#colorOrgRevenue)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Subscription Info */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Subscription Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Plan</span>
                                    <StatusBadge status={data.subscription_plan as "basic" | "pro"} />
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Status</span>
                                    <StatusBadge status={data.subscription_status as "active" | "cancelled" | "expired"} />
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Expires</span>
                                    <span>{formatDate(data.subscription_expires_at)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Max Booths</span>
                                    <span>{data.max_booths}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Created</span>
                                    <span>{formatDate(data.created_at)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Payments */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Payments</CardTitle>
                            <CardDescription>Latest transactions from all booths</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Booth</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.payments.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                No payments yet
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        data.payments.map((payment) => (
                                            <TableRow key={payment.id}>
                                                <TableCell className="font-mono text-sm">{payment.id.slice(0, 8)}</TableCell>
                                                <TableCell>{payment.booth_name}</TableCell>
                                                <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                                                <TableCell>
                                                    <StatusBadge status={payment.status as "PAID" | "PENDING" | "SETTLED"} />
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {formatDateTime(payment.created_at)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Members Tab */}
                <TabsContent value="members">
                    <Card>
                        <CardHeader>
                            <CardTitle>Team Members</CardTitle>
                            <CardDescription>{data.members.length} members in this organization</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Member</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Revenue Share</TableHead>
                                        <TableHead>Joined</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.members.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                No members
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        data.members.map((member) => (
                                            <TableRow key={member.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar>
                                                            <AvatarImage src={member.image_url || undefined} />
                                                            <AvatarFallback>
                                                                {member.name.split(" ").map(n => n[0]).join("")}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="font-medium">{member.name}</div>
                                                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                                                                <IconMail className="h-3 w-3" />
                                                                {member.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={member.role === "org:admin" ? "default" : "secondary"}>
                                                        {member.role === "org:admin" ? "Admin" : "Member"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{member.revenue_share}%</TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {formatDate(member.created_at)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Booths Tab */}
                <TabsContent value="booths">
                    <Card>
                        <CardHeader>
                            <CardTitle>Booths</CardTitle>
                            <CardDescription>
                                {data.booths.length} booths • {onlineBooths} online
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Booth</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Connection</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.booths.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                No booths
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        data.booths.map((booth) => (
                                            <TableRow key={booth.id}>
                                                <TableCell className="font-medium">{booth.name || "Unnamed"}</TableCell>
                                                <TableCell className="text-muted-foreground">{booth.location || "-"}</TableCell>
                                                <TableCell>{booth.price ? formatCurrency(booth.price) : "-"}</TableCell>
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
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Payments Tab */}
                <TabsContent value="payments">
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment History</CardTitle>
                            <CardDescription>All payments for this organization</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Booth</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.payments.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                No payments
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        data.payments.map((payment) => (
                                            <TableRow key={payment.id}>
                                                <TableCell className="font-mono text-sm">{payment.id.slice(0, 8)}</TableCell>
                                                <TableCell>{payment.booth_name}</TableCell>
                                                <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                                                <TableCell>
                                                    <StatusBadge status={payment.status as "PAID" | "PENDING" | "SETTLED"} />
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {formatDateTime(payment.created_at)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings">
                    <Card>
                        <CardHeader>
                            <CardTitle>Organization Settings</CardTitle>
                            <CardDescription>Manage organization configuration</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Organization ID</label>
                                    <div className="font-mono text-sm bg-accent p-2 rounded">{data.id}</div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Slug</label>
                                    <div className="font-mono text-sm bg-accent p-2 rounded">{data.slug}</div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Last Updated</label>
                                    <div className="text-sm bg-accent p-2 rounded">{formatDate(data.updated_at)}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
