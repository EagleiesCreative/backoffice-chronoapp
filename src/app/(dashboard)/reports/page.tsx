"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    IconDownload,
    IconFileSpreadsheet,
    IconChartBar,
    IconCash,
    IconBuilding,
    IconDeviceDesktop,
} from "@tabler/icons-react";

interface ReportData {
    data: Record<string, unknown>[];
    columns: { key: string; label: string }[];
    summary: {
        totalRecords: number;
        dateRange: string;
        reportType: string;
        generatedAt: string;
    };
}

const REPORT_TYPES = [
    { value: 'revenue', label: 'Revenue Report', icon: IconChartBar, description: 'All payment transactions' },
    { value: 'withdrawals', label: 'Withdrawals Report', icon: IconCash, description: 'User withdrawal requests' },
    { value: 'organizations', label: 'Organizations Report', icon: IconBuilding, description: 'All organizations' },
    { value: 'booths', label: 'Booths Report', icon: IconDeviceDesktop, description: 'All booth devices' },
];

function formatValue(value: unknown): string {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'number') {
        if (value >= 1000) {
            return new Intl.NumberFormat('id-ID').format(value);
        }
        return value.toString();
    }
    return String(value);
}

export default function ReportsPage() {
    const [data, setData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(false);
    const [reportType, setReportType] = useState("revenue");
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

    async function generateReport() {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                type: reportType,
                startDate,
                endDate,
            });
            const res = await fetch(`/api/admin/reports?${params}`);
            if (!res.ok) throw new Error("Failed to fetch");
            const json = await res.json();
            setData(json);
        } catch (error) {
            console.error("Error generating report:", error);
        } finally {
            setLoading(false);
        }
    }

    async function exportCSV() {
        const params = new URLSearchParams({
            type: reportType,
            startDate,
            endDate,
            format: 'csv',
        });

        try {
            const res = await fetch(`/api/admin/reports?${params}`);
            if (!res.ok) throw new Error("Failed to export");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${reportType}-report-${startDate}-${endDate}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Error exporting CSV:", error);
        }
    }

    useEffect(() => {
        generateReport();
    }, []);

    const selectedType = REPORT_TYPES.find(t => t.value === reportType);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
                <p className="text-muted-foreground">
                    Generate and export custom reports
                </p>
            </div>

            {/* Report Types */}
            <div className="grid gap-4 md:grid-cols-4">
                {REPORT_TYPES.map((type) => (
                    <Card
                        key={type.value}
                        className={`cursor-pointer transition-all hover:border-violet-500/50 ${reportType === type.value ? 'border-violet-500 bg-violet-500/10' : ''
                            }`}
                        onClick={() => setReportType(type.value)}
                    >
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${reportType === type.value ? 'bg-violet-500/20' : 'bg-accent'}`}>
                                    <type.icon className={`h-5 w-5 ${reportType === type.value ? 'text-violet-500' : ''}`} />
                                </div>
                                <div>
                                    <div className="font-medium">{type.label}</div>
                                    <div className="text-xs text-muted-foreground">{type.description}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Report Parameters</CardTitle>
                    <CardDescription>
                        Configure date range and filters for your report
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-[180px]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>End Date</Label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-[180px]"
                            />
                        </div>
                        <Button onClick={generateReport} disabled={loading}>
                            {loading ? (
                                <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <IconChartBar className="mr-2 h-4 w-4" />
                            )}
                            Generate Report
                        </Button>
                        {data && data.data.length > 0 && (
                            <Button variant="outline" onClick={exportCSV}>
                                <IconDownload className="mr-2 h-4 w-4" />
                                Export CSV
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Report Results */}
            {data && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <IconFileSpreadsheet className="h-5 w-5" />
                                    {selectedType?.label}
                                </CardTitle>
                                <CardDescription>
                                    {data.summary.totalRecords} records • {data.summary.dateRange}
                                </CardDescription>
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Generated: {new Date(data.summary.generatedAt).toLocaleString()}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex justify-center py-10">
                                <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : data.data.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">
                                No data found for the selected parameters
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {data.columns.map((col) => (
                                                <TableHead key={col.key}>{col.label}</TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.data.slice(0, 100).map((row, idx) => (
                                            <TableRow key={idx}>
                                                {data.columns.map((col) => (
                                                    <TableCell key={col.key}>
                                                        {formatValue(row[col.key])}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                        {data.data.length > 100 && (
                            <div className="text-center py-4 text-muted-foreground border-t">
                                Showing first 100 of {data.data.length} records. Export to see all.
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
