"use client";

import { useEffect, useState } from "react";
import { MetricCard } from "@/components/metric-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    IconLoader2,
    IconDeviceDesktop,
    IconCurrencyDollar,
    IconUsers,
    IconWifi,
    IconWifiOff,
    IconTrophy,
} from "@tabler/icons-react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";

interface BoothPerformance {
    id: string;
    name: string;
    organization: string;
    location: string;
    price: number;
    status: string;
    is_online: boolean;
    revenue: number;
    sessions: number;
    avgSessionDuration: number;
}

interface PerformanceData {
    booths: BoothPerformance[];
    totals: {
        totalBooths: number;
        onlineBooths: number;
        totalRevenue: number;
        totalSessions: number;
    };
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);
}

const COLORS = ['#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6'];

export default function BoothPerformancePage() {
    const [data, setData] = useState<PerformanceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState("30");

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const res = await fetch(`/api/admin/booth-performance?days=${days}`);
                if (!res.ok) throw new Error("Failed to fetch");
                const json = await res.json();
                setData(json);
            } catch (error) {
                console.error("Error fetching booth performance:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [days]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!data) {
        return <div className="text-center text-muted-foreground py-10">Failed to load data</div>;
    }

    // Prepare chart data
    const chartData = data.booths.slice(0, 10).map((b, i) => ({
        name: b.name.length > 15 ? b.name.slice(0, 15) + '...' : b.name,
        revenue: b.revenue,
        sessions: b.sessions,
    }));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Booth Performance</h1>
                    <p className="text-muted-foreground">Analyze revenue and usage by booth</p>
                </div>
                <Select value={days} onValueChange={setDays}>
                    <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7">Last 7 days</SelectItem>
                        <SelectItem value="30">Last 30 days</SelectItem>
                        <SelectItem value="90">Last 90 days</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <MetricCard
                    title="Total Booths"
                    value={data.totals.totalBooths.toString()}
                    icon={<IconDeviceDesktop className="h-5 w-5" />}
                />
                <MetricCard
                    title="Online Now"
                    value={data.totals.onlineBooths.toString()}
                    icon={<IconWifi className="h-5 w-5" />}
                    trend={{ value: Math.round((data.totals.onlineBooths / Math.max(data.totals.totalBooths, 1)) * 100), label: "of total", isPositive: true }}
                />
                <MetricCard
                    title="Total Revenue"
                    value={formatCurrency(data.totals.totalRevenue)}
                    icon={<IconCurrencyDollar className="h-5 w-5" />}
                />
                <MetricCard
                    title="Total Sessions"
                    value={data.totals.totalSessions.toString()}
                    icon={<IconUsers className="h-5 w-5" />}
                />
            </div>

            {/* Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Top 10 Booths by Revenue</CardTitle>
                    <CardDescription>Compare revenue across booths</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis type="number" stroke="#666" fontSize={12} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                                <YAxis dataKey="name" type="category" stroke="#666" fontSize={12} width={120} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: "#1e1e2e", border: "1px solid #333", borderRadius: "8px" }}
                                    formatter={(value) => formatCurrency(value as number)}
                                />
                                <Legend />
                                <Bar dataKey="revenue" fill="#8b5cf6" name="Revenue" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Top Performers */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <IconTrophy className="h-5 w-5 text-yellow-500" />
                        All Booth Performance
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Rank</TableHead>
                                <TableHead>Booth</TableHead>
                                <TableHead>Organization</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Revenue</TableHead>
                                <TableHead className="text-right">Sessions</TableHead>
                                <TableHead className="text-right">Avg/Session</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.booths.map((booth, index) => (
                                <TableRow key={booth.id}>
                                    <TableCell>
                                        <span className={`font-bold ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-amber-600' : ''}`}>
                                            #{index + 1}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{booth.name}</div>
                                        <div className="text-sm text-muted-foreground">{booth.location}</div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{booth.organization}</TableCell>
                                    <TableCell>
                                        {booth.is_online ? (
                                            <Badge className="bg-green-500/20 text-green-500">
                                                <IconWifi className="h-3 w-3 mr-1" /> Online
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary">
                                                <IconWifiOff className="h-3 w-3 mr-1" /> Offline
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">{formatCurrency(booth.revenue)}</TableCell>
                                    <TableCell className="text-right">{booth.sessions}</TableCell>
                                    <TableCell className="text-right text-muted-foreground">
                                        {booth.sessions > 0 ? formatCurrency(booth.revenue / booth.sessions) : '-'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
