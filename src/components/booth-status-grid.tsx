"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    IconWifi,
    IconWifiOff,
    IconRefresh,
    IconLoader2,
} from "@tabler/icons-react";

interface BoothStatus {
    id: string;
    name: string | null;
    status: string;
    is_online: boolean;
    organization_name: string;
    last_heartbeat: string | null;
}

interface BoothGridProps {
    refreshInterval?: number; // in seconds
    showTitle?: boolean;
    maxItems?: number;
}

function formatRelativeTime(dateStr: string | null): string {
    if (!dateStr) return "Never";
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    if (diffSecs < 60) return `${diffSecs}s ago`;
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
}

export function BoothStatusGrid({ refreshInterval = 30, showTitle = true, maxItems = 24 }: BoothGridProps) {
    const [booths, setBooths] = useState<BoothStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchBooths = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/system");
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setBooths(data.boothGrid || []);
            setLastUpdated(new Date());
        } catch (error) {
            console.error("Error fetching booth status:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBooths();

        // Set up polling for real-time updates
        const interval = setInterval(fetchBooths, refreshInterval * 1000);
        return () => clearInterval(interval);
    }, [fetchBooths, refreshInterval]);

    const onlineCount = booths.filter(b => b.is_online).length;
    const offlineCount = booths.length - onlineCount;

    if (loading) {
        return (
            <Card>
                {showTitle && (
                    <CardHeader>
                        <CardTitle>Booth Status</CardTitle>
                    </CardHeader>
                )}
                <CardContent className="flex justify-center py-10">
                    <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            {showTitle && (
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            Booth Status
                            <Badge variant="outline" className="ml-2 text-xs">
                                Live
                            </Badge>
                        </CardTitle>
                        <CardDescription>
                            {onlineCount} online · {offlineCount} offline · Updates every {refreshInterval}s
                        </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={fetchBooths}>
                        <IconRefresh className="h-4 w-4" />
                    </Button>
                </CardHeader>
            )}
            <CardContent>
                {booths.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No booths registered</p>
                ) : (
                    <>
                        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                            {booths.slice(0, maxItems).map((booth) => (
                                <div
                                    key={booth.id}
                                    className={`aspect-square rounded-lg flex flex-col items-center justify-center p-2 text-xs transition-all ${booth.is_online
                                            ? 'bg-green-500/20 border border-green-500/50 hover:bg-green-500/30'
                                            : 'bg-red-500/10 border border-red-500/30 hover:bg-red-500/20'
                                        }`}
                                    title={`${booth.name || 'Unnamed'}\n${booth.organization_name}\nLast seen: ${formatRelativeTime(booth.last_heartbeat)}`}
                                >
                                    {booth.is_online ? (
                                        <IconWifi className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <IconWifiOff className="h-4 w-4 text-red-500" />
                                    )}
                                    <span className="truncate w-full text-center mt-1">
                                        {booth.name?.slice(0, 6) || '?'}
                                    </span>
                                </div>
                            ))}
                        </div>
                        {booths.length > maxItems && (
                            <p className="text-center text-muted-foreground text-sm mt-4">
                                +{booths.length - maxItems} more booths
                            </p>
                        )}
                        {lastUpdated && (
                            <p className="text-center text-muted-foreground text-xs mt-4">
                                Last updated: {lastUpdated.toLocaleTimeString()}
                            </p>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
