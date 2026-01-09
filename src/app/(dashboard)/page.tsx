"use client";

import { useEffect, useState } from "react";
import { MetricCard } from "@/components/metric-card";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    IconBuilding,
    IconUsers,
    IconDeviceDesktop,
    IconCurrencyDollar,
    IconCash,
    IconWifi,
    IconChartBar,
    IconArrowUpRight,
    IconClock,
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
    PieChart,
    Pie,
    Cell,
} from "recharts";
import Link from "next/link";

interface DashboardData {
    totalOrganizations: number;
    totalUsers: number;
    totalBooths: number;
    onlineBooths: number;
    revenueThisMonth: number;
    revenueLastMonth: number;
    pendingWithdrawals: Withdrawal[];
    subscriptionDistribution: { name: string; value: number; color: string }[];
    revenueChart: { date: string; amount: number }[];
    recentPayments: Payment[];
}

interface Withdrawal {
    id: string;
    user_name: string;
    amount: number;
    bank_name: string;
    created_at: string;
}

interface Payment {
    id: string;
    amount: number;
    booth_name: string;
    created_at: string;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

function formatRelativeTime(dateStr: string): string {
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

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchDashboard() {
            try {
                const res = await fetch("/api/admin/dashboard");
                if (!res.ok) throw new Error("Failed to fetch dashboard data");
                const json = await res.json();
                setData(json);
            } catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred");
            } finally {
                setLoading(false);
            }
        }
        fetchDashboard();
    }, []);

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
                <p className="text-red-500">{error || "Failed to load dashboard"}</p>
                <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
        );
    }

    const revenueTrend = data.revenueLastMonth > 0
        ? Math.round(((data.revenueThisMonth - data.revenueLastMonth) / data.revenueLastMonth) * 100)
        : 0;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">
                    Platform overview and key metrics
                </p>
            </div>

            {/* Metric Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Total Organizations"
                    value={data.totalOrganizations.toString()}
                    icon={<IconBuilding className="h-5 w-5" />}
                />
                <MetricCard
                    title="Total Users"
                    value={data.totalUsers.toString()}
                    icon={<IconUsers className="h-5 w-5" />}
                />
                <MetricCard
                    title="Active Booths"
                    value={data.totalBooths.toString()}
                    icon={<IconDeviceDesktop className="h-5 w-5" />}
                    description={`${data.onlineBooths} currently online`}
                />
                <MetricCard
                    title="Revenue This Month"
                    value={formatCurrency(data.revenueThisMonth)}
                    icon={<IconCurrencyDollar className="h-5 w-5" />}
                    trend={revenueTrend !== 0 ? {
                        value: Math.abs(revenueTrend),
                        label: "from last month",
                        isPositive: revenueTrend > 0
                    } : undefined}
                />
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-7">
                {/* Revenue Chart */}
                <Card className="lg:col-span-5">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Revenue Overview</CardTitle>
                                <CardDescription>Daily revenue for the past week</CardDescription>
                            </div>
                            <Tabs defaultValue="week" className="w-auto">
                                <TabsList className="h-8">
                                    <TabsTrigger value="day" className="text-xs">Day</TabsTrigger>
                                    <TabsTrigger value="week" className="text-xs">Week</TabsTrigger>
                                    <TabsTrigger value="month" className="text-xs">Month</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.revenueChart}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#666"
                                        fontSize={12}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        stroke="#666"
                                        fontSize={12}
                                        tickLine={false}
                                        tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
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
                                        fill="url(#colorRevenue)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Subscription Distribution */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Subscriptions</CardTitle>
                        <CardDescription>Plan distribution</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.subscriptionDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {data.subscriptionDistribution.map((entry, index) => (
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
                            {data.subscriptionDistribution.map((item) => (
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

            {/* Bottom Row */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Payments */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Recent Payments</CardTitle>
                                <CardDescription>Latest transactions</CardDescription>
                            </div>
                            <Link href="/payments">
                                <Button variant="ghost" size="sm" className="text-xs">
                                    View all
                                    <IconArrowUpRight className="ml-1 h-3 w-3" />
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data.recentPayments.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">No recent payments</p>
                            ) : (
                                data.recentPayments.map((payment) => (
                                    <div
                                        key={payment.id}
                                        className="flex items-start gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                                    >
                                        <div className="p-2 rounded-lg bg-accent text-green-500">
                                            <IconCurrencyDollar className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium">{formatCurrency(payment.amount)}</p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {payment.booth_name}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <IconClock className="h-3 w-3" />
                                            {formatRelativeTime(payment.created_at)}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Pending Withdrawals */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    Pending Withdrawals
                                    {data.pendingWithdrawals.length > 0 && (
                                        <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500">
                                            {data.pendingWithdrawals.length}
                                        </Badge>
                                    )}
                                </CardTitle>
                                <CardDescription>Awaiting approval</CardDescription>
                            </div>
                            <Link href="/withdrawals">
                                <Button variant="ghost" size="sm" className="text-xs">
                                    View all
                                    <IconArrowUpRight className="ml-1 h-3 w-3" />
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data.pendingWithdrawals.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">No pending withdrawals</p>
                            ) : (
                                data.pendingWithdrawals.slice(0, 5).map((withdrawal) => (
                                    <div
                                        key={withdrawal.id}
                                        className="flex items-center justify-between p-3 rounded-lg border border-border"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarFallback className="bg-accent text-xs">
                                                    {withdrawal.user_name?.split(" ").map(n => n[0]).join("") || "?"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-medium">{withdrawal.user_name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {withdrawal.bank_name} • {formatRelativeTime(withdrawal.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-semibold">
                                                {formatCurrency(withdrawal.amount)}
                                            </span>
                                            <div className="flex gap-1">
                                                <Button size="sm" variant="outline" className="h-7 text-xs">
                                                    Reject
                                                </Button>
                                                <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700">
                                                    Approve
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
