"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    IconSettings,
    IconKey,
    IconMail,
    IconPlus,
    IconTrash,
    IconShield,
} from "@tabler/icons-react";

const adminUsers = [
    {
        id: "admin_1",
        name: "Super Admin",
        email: "admin@eagleies.com",
        role: "super_admin",
        last_active: "2024-12-28T14:30:00Z",
    },
    {
        id: "admin_2",
        name: "John Admin",
        email: "john@eagleies.com",
        role: "admin",
        last_active: "2024-12-28T12:00:00Z",
    },
    {
        id: "admin_3",
        name: "Support Team",
        email: "support@chronosnap.com",
        role: "support",
        last_active: "2024-12-27T18:00:00Z",
    },
];

function formatRelativeTime(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
}

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">
                    Platform configuration and admin management
                </p>
            </div>

            <Tabs defaultValue="general">
                <TabsList>
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="xendit">Xendit</TabsTrigger>
                    <TabsTrigger value="admins">Admin Users</TabsTrigger>
                </TabsList>

                {/* General Settings */}
                <TabsContent value="general" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <IconSettings className="h-5 w-5" />
                                Platform Settings
                            </CardTitle>
                            <CardDescription>General platform configuration</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="revenueShare">Default Revenue Share (%)</Label>
                                    <Input id="revenueShare" type="number" defaultValue="80" />
                                    <p className="text-xs text-muted-foreground">
                                        Default percentage for new organization members
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="commission">Platform Commission (%)</Label>
                                    <Input id="commission" type="number" defaultValue="5" />
                                    <p className="text-xs text-muted-foreground">
                                        Commission taken from each transaction
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="defaultPlan">Default Subscription Plan</Label>
                                    <Input id="defaultPlan" defaultValue="basic" />
                                    <p className="text-xs text-muted-foreground">
                                        Plan assigned to new organizations
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="withdrawalFee">Withdrawal Fee (IDR)</Label>
                                    <Input id="withdrawalFee" type="number" defaultValue="5000" />
                                    <p className="text-xs text-muted-foreground">
                                        Fee deducted from each withdrawal
                                    </p>
                                </div>
                            </div>
                            <Separator />
                            <Button>Save Changes</Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Xendit Settings */}
                <TabsContent value="xendit" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <IconKey className="h-5 w-5" />
                                Xendit Configuration
                            </CardTitle>
                            <CardDescription>Payment gateway settings</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="xenditKey">API Key</Label>
                                    <Input id="xenditKey" type="password" defaultValue="xnd_development_xxxxx" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="xenditWebhook">Webhook Secret</Label>
                                    <Input id="xenditWebhook" type="password" defaultValue="whsec_xxxxx" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Webhook URL</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            readOnly
                                            value="https://admin.chronosnap.com/api/webhooks/xendit"
                                            className="font-mono text-sm"
                                        />
                                        <Button variant="outline">Copy</Button>
                                    </div>
                                </div>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-medium">Test Mode</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Currently using development keys
                                    </p>
                                </div>
                                <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500">
                                    Development
                                </Badge>
                            </div>
                            <Separator />
                            <Button>Save Configuration</Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Admin Users */}
                <TabsContent value="admins" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <IconShield className="h-5 w-5" />
                                        Admin Users
                                    </CardTitle>
                                    <CardDescription>Manage backoffice access</CardDescription>
                                </div>
                                <Button>
                                    <IconPlus className="mr-2 h-4 w-4" />
                                    Invite Admin
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Last Active</TableHead>
                                        <TableHead className="w-[100px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {adminUsers.map((admin) => (
                                        <TableRow key={admin.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarFallback>
                                                            {admin.name.split(" ").map(n => n[0]).join("")}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium">{admin.name}</div>
                                                        <div className="text-sm text-muted-foreground">{admin.email}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={admin.role === "super_admin" ? "default" : "secondary"}>
                                                    {admin.role.replace("_", " ")}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {formatRelativeTime(admin.last_active)}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-600"
                                                    disabled={admin.role === "super_admin"}
                                                >
                                                    <IconTrash className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
