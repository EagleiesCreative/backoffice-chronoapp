"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { MetricCard } from "@/components/metric-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    IconCurrencyDollar,
    IconUsers,
    IconTrendingUp,
    IconLoader2,
    IconCrown,
    IconSparkles,
} from "@tabler/icons-react";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    PieChart,
    Pie,
    Cell,
} from "recharts";

interface SubscriptionData {
    stats: {
        totalOrganizations: number;
        basicCount: number;
        proCount: number;
        activeCount: number;
        cancelledCount: number;
        expiredCount: number;
        currentMRR: number;
    };
    distribution: { name: string; value: number; color: string }[];
    statusDistribution: { name: string; value: number; color: string }[];
    mrrChart: { date: string; mrr: number }[];
    recentChanges: { action: string; amount: number; created_at: string }[];
    plans: { id: string; name: string; price: number; max_booths: number; features: Record<string, boolean> }[];
    organizations: {
        id: string;
        name: string;
        subscription_plan: string;
        subscription_status: string;
        subscription_expires_at: string | null;
        max_booths: number;
    }[];
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

export default function SubscriptionsPage() {
    const [data, setData] = useState<SubscriptionData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchSubscriptions() {
            try {
                const res = await fetch("/api/admin/subscriptions");
                if (!res.ok) throw new Error("Failed to fetch");
                const json = await res.json();
                setData(json);
            } catch (error) {
                console.error("Error fetching subscriptions:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchSubscriptions();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p className="text-muted-foreground">Failed to load subscriptions</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
                <p className="text-muted-foreground">
                    Manage subscription plans and monitor recurring revenue
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <MetricCard
                    title="Monthly Recurring Revenue"
                    value={formatCurrency(data.stats.currentMRR)}
                    icon={<IconCurrencyDollar className="h-5 w-5" />}
                />
                <MetricCard
                    title="Pro Subscribers"
                    value={data.stats.proCount.toString()}
                    icon={<IconCrown className="h-5 w-5 text-violet-500" />}
                />
                <MetricCard
                    title="Active Subscriptions"
                    value={data.stats.activeCount.toString()}
                    icon={<IconTrendingUp className="h-5 w-5 text-green-500" />}
                />
                <MetricCard
                    title="Total Organizations"
                    value={data.stats.totalOrganizations.toString()}
                    icon={<IconUsers className="h-5 w-5" />}
                />
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-7">
                {/* MRR Chart */}
                <Card className="lg:col-span-5">
                    <CardHeader>
                        <CardTitle>MRR Trend</CardTitle>
                        <CardDescription>Monthly recurring revenue over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.mrrChart}>
                                    <defs>
                                        <linearGradient id="colorMRR" x1="0" y1="0" x2="0" y2="1">
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
                                        formatter={(value) => value != null ? [formatCurrency(Number(value)), "MRR"] : ['', "MRR"]}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="mrr"
                                        stroke="#8b5cf6"
                                        strokeWidth={2}
                                        fill="url(#colorMRR)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Plan Distribution */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Plan Distribution</CardTitle>
                        <CardDescription>Subscribers by plan type</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.distribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {data.distribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "#1e1e2e",
                                            border: "1px solid #333",
                                            borderRadius: "8px",
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center gap-6 mt-4">
                            {data.distribution.map((item) => (
                                <div key={item.name} className="flex items-center gap-2">
                                    <div
                                        className="h-3 w-3 rounded-full"
                                        style={{ backgroundColor: item.color }}
                                    />
                                    <span className="text-sm text-muted-foreground">
                                        {item.name}: {item.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="subscribers" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
                    <TabsTrigger value="plans">Plans</TabsTrigger>
                </TabsList>

                {/* Subscribers Tab */}
                <TabsContent value="subscribers">
                    <Card>
                        <CardHeader>
                            <CardTitle>All Subscribers</CardTitle>
                            <CardDescription>Organization subscription status</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Organization</TableHead>
                                        <TableHead>Plan</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Max Booths</TableHead>
                                        <TableHead>Expires</TableHead>
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
                                        data.organizations.map((org) => (
                                            <TableRow key={org.id}>
                                                <TableCell>
                                                    <Link href={`/organizations/${org.id}`} className="font-medium hover:underline">
                                                        {org.name}
                                                    </Link>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={org.subscription_plan === "pro" ? "default" : "secondary"}
                                                        className={org.subscription_plan === "pro" ? "bg-violet-500" : ""}
                                                    >
                                                        {org.subscription_plan === "pro" && <IconCrown className="h-3 w-3 mr-1" />}
                                                        {org.subscription_plan.toUpperCase()}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <StatusBadge status={org.subscription_status as "active" | "cancelled" | "expired"} />
                                                </TableCell>
                                                <TableCell>{org.max_booths}</TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {formatDate(org.subscription_expires_at)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Plans Tab */}
                <TabsContent value="plans">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Basic Plan */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        <IconSparkles className="h-5 w-5" />
                                        Basic Plan
                                    </CardTitle>
                                    <Badge variant="secondary">Free</Badge>
                                </div>
                                <CardDescription>For small teams getting started</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="text-3xl font-bold">Free</div>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center gap-2">✓ 1 booth</li>
                                    <li className="flex items-center gap-2">✓ Basic reports</li>
                                    <li className="flex items-center gap-2">✓ Standard support</li>
                                </ul>
                                <div className="pt-4 border-t">
                                    <p className="text-sm text-muted-foreground">
                                        <span className="font-medium">{data.stats.basicCount}</span> organizations on this plan
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Pro Plan */}
                        <Card className="border-violet-500/50 bg-gradient-to-br from-violet-500/10 to-purple-500/10">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        <IconCrown className="h-5 w-5 text-violet-500" />
                                        Pro Plan
                                    </CardTitle>
                                    <Badge className="bg-violet-500">Popular</Badge>
                                </div>
                                <CardDescription>For growing businesses</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="text-3xl font-bold">{formatCurrency(499000)}<span className="text-sm font-normal text-muted-foreground">/month</span></div>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center gap-2">✓ Up to 10 booths</li>
                                    <li className="flex items-center gap-2">✓ Voucher system</li>
                                    <li className="flex items-center gap-2">✓ Multi-print feature</li>
                                    <li className="flex items-center gap-2">✓ Paper tracking reminders</li>
                                    <li className="flex items-center gap-2">✓ Advanced analytics</li>
                                    <li className="flex items-center gap-2">✓ Priority support</li>
                                </ul>
                                <div className="pt-4 border-t">
                                    <p className="text-sm text-muted-foreground">
                                        <span className="font-medium text-violet-500">{data.stats.proCount}</span> organizations on this plan
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
