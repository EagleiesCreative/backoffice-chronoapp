"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    IconRefresh,
    IconLoader2,
    IconCircleCheck,
    IconAlertTriangle,
    IconCircleX,
    IconWifi,
    IconWifiOff,
    IconAlertCircle,
    IconInfoCircle,
    IconBell,
} from "@tabler/icons-react";

interface SystemData {
    overallHealth: 'healthy' | 'degraded' | 'critical';
    alerts: { type: 'error' | 'warning' | 'info'; message: string }[];
    services: {
        name: string;
        status: string;
        responseTime: number | null;
        details: string;
    }[];
    stats: {
        organizations: number;
        users: number;
        booths: number;
        onlineBooths: number;
        offlineBooths: number;
        todayPayments: number;
        pendingWithdrawals: number;
        failedPayments24h: number;
    };
    boothGrid: {
        id: string;
        name: string;
        status: string;
        is_online: boolean;
        organization_name: string;
        last_heartbeat: string | null;
    }[];
    recentErrors: {
        id: string;
        type: string;
        message: string;
        created_at: string;
    }[];
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

function HealthIcon({ status }: { status: string }) {
    if (status === 'healthy') {
        return <IconCircleCheck className="h-5 w-5 text-green-500" />;
    } else if (status === 'degraded') {
        return <IconAlertTriangle className="h-5 w-5 text-yellow-500" />;
    } else {
        return <IconCircleX className="h-5 w-5 text-red-500" />;
    }
}

export default function SystemPage() {
    const [data, setData] = useState<SystemData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    async function fetchSystemHealth() {
        try {
            const res = await fetch("/api/admin/system");
            if (!res.ok) throw new Error("Failed to fetch");
            const json = await res.json();
            setData(json);
        } catch (error) {
            console.error("Error fetching system health:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useEffect(() => {
        fetchSystemHealth();
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchSystemHealth, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchSystemHealth();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <p className="text-red-500">Failed to load system health</p>
                <Button onClick={handleRefresh}>Retry</Button>
            </div>
        );
    }

    const healthColors = {
        healthy: 'bg-green-500/20 border-green-500/50 text-green-500',
        degraded: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-500',
        critical: 'bg-red-500/20 border-red-500/50 text-red-500',
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
                    <p className="text-muted-foreground">
                        Monitor platform services and infrastructure
                    </p>
                </div>
                <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
                    <IconRefresh className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Overall Health Banner */}
            <Card className={`border ${healthColors[data.overallHealth]}`}>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <HealthIcon status={data.overallHealth} />
                        <div>
                            <h2 className="text-xl font-semibold capitalize">{data.overallHealth}</h2>
                            <p className="text-sm text-muted-foreground">
                                {data.overallHealth === 'healthy' && 'All systems operational'}
                                {data.overallHealth === 'degraded' && 'Some services experiencing issues'}
                                {data.overallHealth === 'critical' && 'Critical issues detected'}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Alerts */}
            {data.alerts.length > 0 && (
                <div className="space-y-2">
                    {data.alerts.map((alert, index) => (
                        <div
                            key={index}
                            className={`flex items-center gap-3 p-3 rounded-lg border ${alert.type === 'error' ? 'bg-red-500/10 border-red-500/50' :
                                    alert.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/50' :
                                        'bg-blue-500/10 border-blue-500/50'
                                }`}
                        >
                            {alert.type === 'error' && <IconAlertCircle className="h-5 w-5 text-red-500" />}
                            {alert.type === 'warning' && <IconAlertTriangle className="h-5 w-5 text-yellow-500" />}
                            {alert.type === 'info' && <IconInfoCircle className="h-5 w-5 text-blue-500" />}
                            <span className="text-sm">{alert.message}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Services Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {data.services.map((service) => (
                    <Card key={service.name}>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardDescription>{service.name}</CardDescription>
                                <HealthIcon status={service.status} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground">{service.details}</div>
                            {service.responseTime !== null && (
                                <div className="text-xs text-muted-foreground mt-1">
                                    Response: {service.responseTime}ms
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Stats + Booth Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Quick Stats */}
                <Card>
                    <CardHeader>
                        <CardTitle>Platform Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-4 bg-accent rounded-lg">
                                <div className="text-2xl font-bold">{data.stats.organizations}</div>
                                <div className="text-sm text-muted-foreground">Organizations</div>
                            </div>
                            <div className="text-center p-4 bg-accent rounded-lg">
                                <div className="text-2xl font-bold">{data.stats.users}</div>
                                <div className="text-sm text-muted-foreground">Users</div>
                            </div>
                            <div className="text-center p-4 bg-accent rounded-lg">
                                <div className="text-2xl font-bold text-green-500">{data.stats.onlineBooths}</div>
                                <div className="text-sm text-muted-foreground">Booths Online</div>
                            </div>
                            <div className="text-center p-4 bg-accent rounded-lg">
                                <div className="text-2xl font-bold">{data.stats.todayPayments}</div>
                                <div className="text-sm text-muted-foreground">Today's Payments</div>
                            </div>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t">
                            <span className="text-sm text-muted-foreground flex items-center gap-2">
                                <IconBell className="h-4 w-4" />
                                Pending Withdrawals
                            </span>
                            <Badge variant="secondary">{data.stats.pendingWithdrawals}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground flex items-center gap-2">
                                <IconAlertTriangle className="h-4 w-4" />
                                Failed Payments (24h)
                            </span>
                            <Badge variant={data.stats.failedPayments24h > 0 ? "destructive" : "secondary"}>
                                {data.stats.failedPayments24h}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Booth Grid */}
                <Card>
                    <CardHeader>
                        <CardTitle>Booth Status Grid</CardTitle>
                        <CardDescription>
                            {data.stats.onlineBooths}/{data.stats.booths} online
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {data.boothGrid.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">No booths registered</p>
                        ) : (
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                {data.boothGrid.slice(0, 24).map((booth) => (
                                    <div
                                        key={booth.id}
                                        className={`aspect-square rounded-lg flex flex-col items-center justify-center p-2 text-xs ${booth.is_online ? 'bg-green-500/20 border border-green-500/50' : 'bg-red-500/10 border border-red-500/30'
                                            }`}
                                        title={`${booth.name} - ${booth.organization_name}\nLast seen: ${formatRelativeTime(booth.last_heartbeat)}`}
                                    >
                                        {booth.is_online ? (
                                            <IconWifi className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <IconWifiOff className="h-4 w-4 text-red-500" />
                                        )}
                                        <span className="truncate w-full text-center mt-1">{booth.name?.slice(0, 6) || '?'}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent Errors */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Errors</CardTitle>
                    <CardDescription>Failed payments and issues in the last 24 hours</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Message</TableHead>
                                <TableHead>Time</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.recentErrors.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                        No errors in the last 24 hours ✓
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.recentErrors.map((error) => (
                                    <TableRow key={error.id}>
                                        <TableCell className="font-mono text-sm">{error.id.slice(0, 8)}</TableCell>
                                        <TableCell>
                                            <Badge variant="destructive">{error.type}</Badge>
                                        </TableCell>
                                        <TableCell>{error.message}</TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {formatRelativeTime(error.created_at)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
