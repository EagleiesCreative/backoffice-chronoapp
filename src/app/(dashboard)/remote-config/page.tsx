"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
    IconSettings,
    IconWifi,
    IconWifiOff,
    IconTool,
    IconSend,
} from "@tabler/icons-react";

interface Booth {
    id: string;
    name: string | null;
    organization_name: string;
    status: string;
    price: number;
    is_online: boolean;
    last_heartbeat: string | null;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
}

export default function RemoteConfigPage() {
    const [booths, setBooths] = useState<Booth[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooth, setSelectedBooth] = useState<Booth | null>(null);
    const [configDialog, setConfigDialog] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Config form
    const [config, setConfig] = useState({
        price: 0,
        status: 'active',
        maintenance_mode: false,
        auto_print: true,
        session_timeout: 300,
    });

    async function fetchBooths() {
        try {
            const res = await fetch('/api/admin/system');
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setBooths(data.boothGrid || []);
        } catch (error) {
            console.error("Error fetching booths:", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchBooths();
    }, []);

    function openConfig(booth: Booth) {
        setSelectedBooth(booth);
        setConfig({
            price: booth.price || 0,
            status: booth.status || 'active',
            maintenance_mode: booth.status === 'maintenance',
            auto_print: true,
            session_timeout: 300,
        });
        setConfigDialog(true);
    }

    async function saveConfig() {
        if (!selectedBooth) return;
        setProcessing(true);
        try {
            // This would push config to the booth via your booth API
            // For now, we'll just show a success message
            alert(`Configuration saved for ${selectedBooth.name}!\n\nIn production, this would push settings to the booth via WebSocket or API.`);
            setConfigDialog(false);
        } catch (error) {
            console.error("Error saving config:", error);
        } finally {
            setProcessing(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Remote Configuration</h1>
                <p className="text-muted-foreground">Push settings to booth devices remotely</p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <IconWifi className="h-5 w-5 text-green-500" />
                            <div>
                                <div className="text-2xl font-bold">{booths.filter(b => b.is_online).length}</div>
                                <div className="text-sm text-muted-foreground">Online (Configurable)</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <IconWifiOff className="h-5 w-5 text-red-500" />
                            <div>
                                <div className="text-2xl font-bold">{booths.filter(b => !b.is_online).length}</div>
                                <div className="text-sm text-muted-foreground">Offline</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <IconTool className="h-5 w-5 text-orange-500" />
                            <div>
                                <div className="text-2xl font-bold">{booths.filter(b => b.status === 'maintenance').length}</div>
                                <div className="text-sm text-muted-foreground">In Maintenance</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Booths Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Booth Devices</CardTitle>
                    <CardDescription>Click on a booth to configure it remotely</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Booth</TableHead>
                                <TableHead>Organization</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {booths.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No booths found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                booths.map((booth) => (
                                    <TableRow key={booth.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {booth.is_online ? (
                                                    <IconWifi className="h-4 w-4 text-green-500" />
                                                ) : (
                                                    <IconWifiOff className="h-4 w-4 text-red-500" />
                                                )}
                                                <span className="font-medium">{booth.name || 'Unnamed'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{booth.organization_name}</TableCell>
                                        <TableCell>
                                            <Badge variant={booth.status === 'active' ? 'default' : 'secondary'}>
                                                {booth.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{formatCurrency(booth.price || 0)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" variant="outline" onClick={() => openConfig(booth)}>
                                                <IconSettings className="h-4 w-4 mr-1" />
                                                Configure
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Config Dialog */}
            <Dialog open={configDialog} onOpenChange={setConfigDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Configure {selectedBooth?.name}</DialogTitle>
                        <DialogDescription>Push settings to this booth remotely</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Price (IDR)</Label>
                            <Input type="number" value={config.price} onChange={e => setConfig({ ...config, price: parseInt(e.target.value) || 0 })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={config.status} onValueChange={v => setConfig({ ...config, status: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                    <SelectItem value="maintenance">Maintenance</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Session Timeout (seconds)</Label>
                            <Input type="number" value={config.session_timeout} onChange={e => setConfig({ ...config, session_timeout: parseInt(e.target.value) || 300 })} />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label>Auto Print</Label>
                            <Switch checked={config.auto_print} onCheckedChange={v => setConfig({ ...config, auto_print: v })} />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label>Maintenance Mode</Label>
                            <Switch checked={config.maintenance_mode} onCheckedChange={v => setConfig({ ...config, maintenance_mode: v })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfigDialog(false)}>Cancel</Button>
                        <Button onClick={saveConfig} disabled={processing || !selectedBooth?.is_online}>
                            {processing ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <><IconSend className="h-4 w-4 mr-1" />Push Config</>}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
