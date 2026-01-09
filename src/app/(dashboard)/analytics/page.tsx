"use client";

import { useEffect, useState } from "react";
import { MetricCard } from "@/components/metric-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    IconCurrencyDollar,
    IconShoppingCart,
    IconTrendingUp,
    IconDeviceDesktop,
    IconUsers,
    IconBuilding,
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
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
} from "recharts";

interface AnalyticsData {
    stats: {
        totalRevenue: number;
        totalTransactions: number;
        avgTransactionValue: number;
        revenueGrowth: number;
        orgCount: number;
        userCount: number;
        boothCount: number;
        sessionCount: number;
    };
    revenueChart: { date: string; amount: number }[];
    paymentMethods: { name: string; value: number }[];
    topBooths: { name: string; org: string; revenue: number }[];
}

const COLORS = ['#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState("30");

    useEffect(() => {
        async function fetchAnalytics() {
            setLoading(true);
            try {
                const res = await fetch(`/api/admin/analytics?days=${days}`);
                if (!res.ok) throw new Error("Failed to fetch");
                const json = await res.json();
                setData(json);
            } catch (error) {
                console.error("Error fetching analytics:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchAnalytics();
    }, [days]);

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
                <p className="text-muted-foreground">Failed to load analytics</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
                    <p className="text-muted-foreground">
                        Platform performance and revenue insights
                    </p>
                </div>
                <Select value={days} onValueChange={setDays}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7">Last 7 days</SelectItem>
                        <SelectItem value="30">Last 30 days</SelectItem>
                        <SelectItem value="90">Last 90 days</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Revenue Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <MetricCard
                    title="Total Revenue"
                    value={formatCurrency(data.stats.totalRevenue)}
                    icon={<IconCurrencyDollar className="h-5 w-5" />}
                    trend={data.stats.revenueGrowth !== 0 ? {
                        value: Math.abs(data.stats.revenueGrowth),
                        label: "vs previous period",
                        isPositive: data.stats.revenueGrowth > 0,
                    } : undefined}
                />
                <MetricCard
                    title="Transactions"
                    value={data.stats.totalTransactions.toString()}
                    icon={<IconShoppingCart className="h-5 w-5" />}
                />
                <MetricCard
                    title="Avg. Transaction"
                    value={formatCurrency(data.stats.avgTransactionValue)}
                    icon={<IconTrendingUp className="h-5 w-5" />}
                />
                <MetricCard
                    title="Sessions"
                    value={data.stats.sessionCount.toString()}
                    icon={<IconDeviceDesktop className="h-5 w-5" />}
                />
            </div>

            {/* Platform Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-violet-500/20">
                                <IconBuilding className="h-6 w-6 text-violet-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Organizations</p>
                                <p className="text-2xl font-bold">{data.stats.orgCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-green-500/20">
                                <IconUsers className="h-6 w-6 text-green-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Users</p>
                                <p className="text-2xl font-bold">{data.stats.userCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-blue-500/20">
                                <IconDeviceDesktop className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Booths</p>
                                <p className="text-2xl font-bold">{data.stats.boothCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <Tabs defaultValue="revenue" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="revenue">Revenue</TabsTrigger>
                    <TabsTrigger value="methods">Payment Methods</TabsTrigger>
                    <TabsTrigger value="booths">Top Booths</TabsTrigger>
                </TabsList>

                {/* Revenue Chart */}
                <TabsContent value="revenue">
                    <Card>
                        <CardHeader>
                            <CardTitle>Revenue Over Time</CardTitle>
                            <CardDescription>Daily revenue for the selected period</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data.revenueChart}>
                                        <defs>
                                            <linearGradient id="colorAnalytics" x1="0" y1="0" x2="0" y2="1">
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
                                            fill="url(#colorAnalytics)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Payment Methods */}
                <TabsContent value="methods">
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment Methods</CardTitle>
                            <CardDescription>Distribution of payment methods used</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-6 lg:grid-cols-2">
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={data.paymentMethods}
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={100}
                                                paddingAngle={2}
                                                dataKey="value"
                                                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                            >
                                                {data.paymentMethods.map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                                <div className="space-y-4">
                                    {data.paymentMethods.map((method, index) => (
                                        <div key={method.name} className="flex items-center justify-between p-3 rounded-lg border">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="h-4 w-4 rounded"
                                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                                />
                                                <span className="font-medium">{method.name}</span>
                                            </div>
                                            <span className="text-muted-foreground">{method.value} transactions</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Top Booths */}
                <TabsContent value="booths">
                    <Card>
                        <CardHeader>
                            <CardTitle>Top Performing Booths</CardTitle>
                            <CardDescription>Booths with highest revenue</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            {data.topBooths.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No booth data available
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Rank</TableHead>
                                            <TableHead>Booth</TableHead>
                                            <TableHead>Organization</TableHead>
                                            <TableHead className="text-right">Revenue</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.topBooths.map((booth, index) => (
                                            <TableRow key={booth.name}>
                                                <TableCell>
                                                    <span className={`font-bold ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-amber-600' : ''}`}>
                                                        #{index + 1}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="font-medium">{booth.name}</TableCell>
                                                <TableCell className="text-muted-foreground">{booth.org}</TableCell>
                                                <TableCell className="text-right font-semibold">
                                                    {formatCurrency(booth.revenue)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
