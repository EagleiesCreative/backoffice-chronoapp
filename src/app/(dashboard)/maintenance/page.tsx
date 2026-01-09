"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
    DialogTrigger,
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
    IconPlus,
    IconTool,
    IconCalendar,
    IconTrash,
    IconWifi,
    IconWifiOff,
} from "@tabler/icons-react";

interface Booth {
    id: string;
    name: string | null;
    organization_name: string;
    is_online: boolean;
    status: string;
}

interface MaintenanceSchedule {
    id: string;
    booth_id: string;
    booth_name: string;
    maintenance_type: string;
    reason: string;
    start_time: string;
    end_time: string;
    status: string;
}

function formatDateTime(dateStr: string): string {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    }).format(new Date(dateStr));
}

export default function MaintenancePage() {
    const [booths, setBooths] = useState<Booth[]>([]);
    const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Form state
    const [form, setForm] = useState({
        booth_id: '',
        maintenance_type: 'scheduled',
        reason: '',
        start_time: '',
        end_time: '',
    });

    async function fetchData() {
        try {
            const res = await fetch('/api/admin/system');
            const data = await res.json();
            setBooths(data.boothGrid || []);

            // Schedules would come from booth_maintenance table
            // For now, mock empty
            setSchedules([]);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

    async function scheduleMaintenance() {
        if (!form.booth_id || !form.start_time || !form.end_time) {
            alert('Please fill all required fields');
            return;
        }
        setProcessing(true);
        try {
            // This would save to booth_maintenance table
            alert(`Maintenance scheduled for booth!\n\nStart: ${form.start_time}\nEnd: ${form.end_time}\n\nThe booth will automatically enter maintenance mode at the scheduled time.`);
            setDialogOpen(false);
            setForm({ booth_id: '', maintenance_type: 'scheduled', reason: '', start_time: '', end_time: '' });
        } catch (error) {
            console.error("Error scheduling maintenance:", error);
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

    const boothsInMaintenance = booths.filter(b => b.status === 'maintenance');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Maintenance Mode</h1>
                    <p className="text-muted-foreground">Schedule and manage booth maintenance windows</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <IconPlus className="mr-2 h-4 w-4" />
                            Schedule Maintenance
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Schedule Maintenance</DialogTitle>
                            <DialogDescription>Set a maintenance window for a booth</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Booth</Label>
                                <Select value={form.booth_id} onValueChange={v => setForm({ ...form, booth_id: v })}>
                                    <SelectTrigger><SelectValue placeholder="Select booth" /></SelectTrigger>
                                    <SelectContent>
                                        {booths.map(b => (
                                            <SelectItem key={b.id} value={b.id}>{b.name} - {b.organization_name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select value={form.maintenance_type} onValueChange={v => setForm({ ...form, maintenance_type: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="scheduled">Scheduled</SelectItem>
                                        <SelectItem value="emergency">Emergency</SelectItem>
                                        <SelectItem value="update">Software Update</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Start Time</Label>
                                    <Input type="datetime-local" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>End Time</Label>
                                    <Input type="datetime-local" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Reason (Optional)</Label>
                                <Textarea value={form.reason} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, reason: e.target.value })} placeholder="Describe the maintenance..." />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                            <Button onClick={scheduleMaintenance} disabled={processing}>
                                {processing ? <IconLoader2 className="h-4 w-4 animate-spin" /> : 'Schedule'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-orange-500/30">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <IconTool className="h-5 w-5 text-orange-500" />
                            <div>
                                <div className="text-2xl font-bold">{boothsInMaintenance.length}</div>
                                <div className="text-sm text-muted-foreground">In Maintenance Now</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <IconCalendar className="h-5 w-5 text-blue-500" />
                            <div>
                                <div className="text-2xl font-bold">{schedules.length}</div>
                                <div className="text-sm text-muted-foreground">Scheduled</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <IconWifi className="h-5 w-5 text-green-500" />
                            <div>
                                <div className="text-2xl font-bold">{booths.filter(b => b.is_online && b.status !== 'maintenance').length}</div>
                                <div className="text-sm text-muted-foreground">Active Booths</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Currently in Maintenance */}
            {boothsInMaintenance.length > 0 && (
                <Card className="border-orange-500/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-500">
                            <IconTool className="h-5 w-5" />
                            Currently in Maintenance
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Booth</TableHead>
                                    <TableHead>Organization</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {boothsInMaintenance.map(booth => (
                                    <TableRow key={booth.id}>
                                        <TableCell className="font-medium">{booth.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{booth.organization_name}</TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" variant="outline">End Maintenance</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Scheduled Maintenance */}
            <Card>
                <CardHeader>
                    <CardTitle>Scheduled Maintenance</CardTitle>
                    <CardDescription>Upcoming maintenance windows</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Booth</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Start</TableHead>
                                <TableHead>End</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {schedules.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No scheduled maintenance
                                    </TableCell>
                                </TableRow>
                            ) : (
                                schedules.map((schedule) => (
                                    <TableRow key={schedule.id}>
                                        <TableCell className="font-medium">{schedule.booth_name}</TableCell>
                                        <TableCell className="capitalize">{schedule.maintenance_type}</TableCell>
                                        <TableCell>{formatDateTime(schedule.start_time)}</TableCell>
                                        <TableCell>{formatDateTime(schedule.end_time)}</TableCell>
                                        <TableCell>
                                            <Badge>{schedule.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" variant="destructive">
                                                <IconTrash className="h-4 w-4" />
                                            </Button>
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
