"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
    IconCheck,
    IconX,
    IconMail,
    IconAlertTriangle,
} from "@tabler/icons-react";

interface Withdrawal {
    id: string;
    amount: number;
    user_name: string;
    organization_name: string;
    status: string;
    created_at: string;
}

export default function BulkActionsPage() {
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [selected, setSelected] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [actionType, setActionType] = useState("withdrawals");

    async function fetchWithdrawals() {
        try {
            const res = await fetch('/api/admin/withdrawals?status=pending');
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setWithdrawals(data.data || []);
        } catch (error) {
            console.error("Error fetching withdrawals:", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (actionType === 'withdrawals') {
            fetchWithdrawals();
        }
    }, [actionType]);

    function toggleAll() {
        if (selected.length === withdrawals.length) {
            setSelected([]);
        } else {
            setSelected(withdrawals.map(w => w.id));
        }
    }

    function toggleOne(id: string) {
        if (selected.includes(id)) {
            setSelected(selected.filter(s => s !== id));
        } else {
            setSelected([...selected, id]);
        }
    }

    async function bulkApprove() {
        if (!confirm(`Approve ${selected.length} withdrawals?`)) return;
        setProcessing(true);
        try {
            for (const id of selected) {
                await fetch('/api/admin/withdrawals', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, action: 'approve' }),
                });
            }
            setSelected([]);
            fetchWithdrawals();
        } catch (error) {
            console.error("Error bulk approving:", error);
        } finally {
            setProcessing(false);
        }
    }

    async function bulkReject() {
        const reason = prompt("Enter rejection reason:");
        if (!reason) return;
        setProcessing(true);
        try {
            for (const id of selected) {
                await fetch('/api/admin/withdrawals', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, action: 'reject', reason }),
                });
            }
            setSelected([]);
            fetchWithdrawals();
        } catch (error) {
            console.error("Error bulk rejecting:", error);
        } finally {
            setProcessing(false);
        }
    }

    function formatCurrency(amount: number): string {
        return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Bulk Actions</h1>
                <p className="text-muted-foreground">Perform actions on multiple items at once</p>
            </div>

            {/* Action Type Selector */}
            <div className="flex gap-4">
                <Select value={actionType} onValueChange={setActionType}>
                    <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="withdrawals">Bulk Withdrawals</SelectItem>
                        <SelectItem value="email">Bulk Email</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {actionType === 'withdrawals' && (
                <>
                    {/* Actions Bar */}
                    {selected.length > 0 && (
                        <Card className="border-violet-500/50 bg-violet-500/10">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">{selected.length} items selected</span>
                                    <div className="flex gap-2">
                                        <Button variant="outline" onClick={() => setSelected([])}>Clear</Button>
                                        <Button variant="destructive" onClick={bulkReject} disabled={processing}>
                                            <IconX className="h-4 w-4 mr-1" />Reject All
                                        </Button>
                                        <Button className="bg-green-600 hover:bg-green-700" onClick={bulkApprove} disabled={processing}>
                                            {processing ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <><IconCheck className="h-4 w-4 mr-1" />Approve All</>}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Withdrawals Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Pending Withdrawals</CardTitle>
                            <CardDescription>Select items to perform bulk actions</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="flex justify-center py-10">
                                    <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12">
                                                <Checkbox checked={selected.length === withdrawals.length && withdrawals.length > 0} onCheckedChange={toggleAll} />
                                            </TableHead>
                                            <TableHead>User</TableHead>
                                            <TableHead>Organization</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {withdrawals.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                    No pending withdrawals
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            withdrawals.map((w) => (
                                                <TableRow key={w.id} className={selected.includes(w.id) ? 'bg-violet-500/10' : ''}>
                                                    <TableCell>
                                                        <Checkbox checked={selected.includes(w.id)} onCheckedChange={() => toggleOne(w.id)} />
                                                    </TableCell>
                                                    <TableCell className="font-medium">{w.user_name}</TableCell>
                                                    <TableCell className="text-muted-foreground">{w.organization_name}</TableCell>
                                                    <TableCell className="text-right font-semibold">{formatCurrency(w.amount || 0)}</TableCell>
                                                    <TableCell>
                                                        <Badge className="bg-yellow-500/20 text-yellow-500">{w.status}</Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}

            {actionType === 'email' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <IconMail className="h-5 w-5" />
                            Bulk Email
                        </CardTitle>
                        <CardDescription>Send emails to multiple organizations</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Recipients</Label>
                            <Select defaultValue="all">
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Organizations</SelectItem>
                                    <SelectItem value="active">Active Subscriptions</SelectItem>
                                    <SelectItem value="expiring">Expiring Soon</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Subject</Label>
                            <Input placeholder="Email subject..." />
                        </div>
                        <div className="space-y-2">
                            <Label>Message</Label>
                            <Textarea placeholder="Your message..." rows={6} />
                        </div>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/50">
                            <IconAlertTriangle className="h-5 w-5 text-yellow-500" />
                            <span className="text-sm text-yellow-500">This will send emails to all selected organizations. Use with caution.</span>
                        </div>
                        <Button className="w-full">
                            <IconMail className="h-4 w-4 mr-2" />
                            Send Bulk Email
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
