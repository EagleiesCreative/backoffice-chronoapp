"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
    IconArrowLeft,
    IconExternalLink,
    IconCopy,
    IconLoader2,
    IconCurrencyDollar,
    IconBuilding,
    IconDeviceDesktop,
    IconCreditCard,
    IconReceipt,
    IconCheck,
} from "@tabler/icons-react";

interface PaymentDetail {
    id: string;
    amount: number | null;
    status: string;
    payment_method: string | null;
    xendit_invoice_id: string | null;
    xendit_invoice_url: string | null;
    session_id: string | null;
    booth_id: string;
    booth_name: string;
    booth_location: string;
    organization_id: string;
    organization_name: string;
    organization_slug: string;
    paid_at: string | null;
    created_at: string | null;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);
}

function formatDateTime(dateStr: string | null): string {
    if (!dateStr) return "-";
    return new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    }).format(new Date(dateStr));
}

export default function PaymentDetailPage() {
    const params = useParams();
    const paymentId = params.id as string;
    const [data, setData] = useState<PaymentDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        async function fetchPayment() {
            try {
                const res = await fetch(`/api/admin/payments/${paymentId}`);
                if (!res.ok) throw new Error("Failed to fetch payment");
                const json = await res.json();
                setData(json);
            } catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred");
            } finally {
                setLoading(false);
            }
        }
        if (paymentId) fetchPayment();
    }, [paymentId]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

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
                <p className="text-red-500">{error || "Payment not found"}</p>
                <Link href="/payments">
                    <Button>Back to Payments</Button>
                </Link>
            </div>
        );
    }

    const isPaid = data.status === 'PAID' || data.status === 'SETTLED';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/payments">
                        <Button variant="ghost" size="icon">
                            <IconArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight">Payment Details</h1>
                            <StatusBadge status={data.status as "PAID" | "PENDING" | "SETTLED" | "EXPIRED" | "FAILED"} />
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="font-mono">{data.id}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => copyToClipboard(data.id)}
                            >
                                {copied ? <IconCheck className="h-3 w-3" /> : <IconCopy className="h-3 w-3" />}
                            </Button>
                        </div>
                    </div>
                </div>
                {data.xendit_invoice_url && (
                    <a href={data.xendit_invoice_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline">
                            <IconExternalLink className="mr-2 h-4 w-4" />
                            View Invoice
                        </Button>
                    </a>
                )}
            </div>

            {/* Amount Card */}
            <Card className={isPaid ? "border-green-500/50 bg-gradient-to-br from-green-500/10 to-emerald-500/10" : ""}>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-muted-foreground">Amount</p>
                            <p className="text-4xl font-bold">
                                {data.amount ? formatCurrency(data.amount) : "-"}
                            </p>
                        </div>
                        <div className={`p-4 rounded-full ${isPaid ? "bg-green-500/20" : "bg-muted"}`}>
                            <IconCurrencyDollar className={`h-8 w-8 ${isPaid ? "text-green-500" : ""}`} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Details Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Transaction Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <IconReceipt className="h-5 w-5" />
                            Transaction Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Status</span>
                            <StatusBadge status={data.status as "PAID" | "PENDING" | "SETTLED"} />
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Payment Method</span>
                            <Badge variant="secondary">{data.payment_method || "Unknown"}</Badge>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Created At</span>
                            <span className="text-right text-sm">{formatDateTime(data.created_at)}</span>
                        </div>
                        {data.paid_at && (
                            <>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Paid At</span>
                                    <span className="text-right text-sm">{formatDateTime(data.paid_at)}</span>
                                </div>
                            </>
                        )}
                        {data.session_id && (
                            <>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Session ID</span>
                                    <span className="font-mono text-sm">{data.session_id.slice(0, 12)}...</span>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Xendit Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <IconCreditCard className="h-5 w-5" />
                            Payment Gateway
                        </CardTitle>
                        <CardDescription>Xendit integration details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Invoice ID</span>
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-sm">{data.xendit_invoice_id || "-"}</span>
                                {data.xendit_invoice_id && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => copyToClipboard(data.xendit_invoice_id!)}
                                    >
                                        <IconCopy className="h-3 w-3" />
                                    </Button>
                                )}
                            </div>
                        </div>
                        {data.xendit_invoice_url && (
                            <>
                                <Separator />
                                <div className="space-y-2">
                                    <span className="text-muted-foreground">Invoice URL</span>
                                    <a
                                        href={data.xendit_invoice_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-violet-500 hover:underline"
                                    >
                                        <IconExternalLink className="h-4 w-4" />
                                        Open Invoice Page
                                    </a>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Booth Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <IconDeviceDesktop className="h-5 w-5" />
                            Booth
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Name</span>
                            <span className="font-medium">{data.booth_name}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Location</span>
                            <span>{data.booth_location || "-"}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Booth ID</span>
                            <span className="font-mono text-sm">{data.booth_id.slice(0, 12)}...</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Organization Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <IconBuilding className="h-5 w-5" />
                            Organization
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Name</span>
                            <Link href={`/organizations/${data.organization_id}`} className="font-medium text-violet-500 hover:underline">
                                {data.organization_name}
                            </Link>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Slug</span>
                            <span>/{data.organization_slug}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
