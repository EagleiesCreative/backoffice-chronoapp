"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
    IconMail,
    IconEdit,
    IconTrash,
    IconEye,
    IconCopy,
} from "@tabler/icons-react";

interface EmailTemplate {
    id: string;
    name: string;
    slug: string;
    subject: string;
    body: string;
    category: string;
    variables: string[];
    is_active: boolean;
}

// Default templates for when table doesn't exist
const DEFAULT_TEMPLATES: EmailTemplate[] = [
    {
        id: '1',
        name: 'Welcome Email',
        slug: 'welcome',
        subject: 'Welcome to ChronoSnap, {{org_name}}!',
        body: `Hi {{user_name}},

Welcome to ChronoSnap! Your organization {{org_name}} has been successfully registered.

Here's what you can do next:
- Set up your first booth
- Configure your pricing
- Start accepting payments

If you have any questions, our support team is here to help.

Best regards,
The ChronoSnap Team`,
        category: 'welcome',
        variables: ['user_name', 'org_name'],
        is_active: true,
    },
    {
        id: '2',
        name: 'Payment Received',
        slug: 'payment_received',
        subject: 'Payment Received - {{amount}}',
        body: `Hi {{user_name}},

Great news! We've received a payment from your booth.

Details:
- Amount: {{amount}}
- Booth: {{booth_name}}
- Date: {{date}}

Your current balance is now {{balance}}.

Best regards,
The ChronoSnap Team`,
        category: 'payment',
        variables: ['user_name', 'amount', 'booth_name', 'date', 'balance'],
        is_active: true,
    },
    {
        id: '3',
        name: 'Withdrawal Approved',
        slug: 'withdrawal_approved',
        subject: 'Withdrawal Approved - {{amount}}',
        body: `Hi {{user_name}},

Your withdrawal request has been approved!

Details:
- Amount: {{amount}}
- Bank: {{bank_name}}
- Account: {{account_number}}
- Expected arrival: 1-2 business days

Thank you for using ChronoSnap!

Best regards,
The ChronoSnap Team`,
        category: 'withdrawal',
        variables: ['user_name', 'amount', 'bank_name', 'account_number'],
        is_active: true,
    },
    {
        id: '4',
        name: 'Subscription Expiring',
        slug: 'subscription_expiring',
        subject: 'Your ChronoSnap subscription is expiring soon',
        body: `Hi {{user_name}},

Your {{plan_name}} subscription for {{org_name}} will expire on {{expiry_date}}.

To continue using all features, please renew your subscription before it expires.

Renew now to avoid any service interruption.

Best regards,
The ChronoSnap Team`,
        category: 'notification',
        variables: ['user_name', 'org_name', 'plan_name', 'expiry_date'],
        is_active: true,
    },
];

const CATEGORIES: Record<string, { color: string; label: string }> = {
    welcome: { color: 'bg-green-500/20 text-green-500', label: 'Welcome' },
    payment: { color: 'bg-blue-500/20 text-blue-500', label: 'Payment' },
    withdrawal: { color: 'bg-violet-500/20 text-violet-500', label: 'Withdrawal' },
    notification: { color: 'bg-yellow-500/20 text-yellow-500', label: 'Notification' },
};

export default function EmailTemplatesPage() {
    const [templates, setTemplates] = useState<EmailTemplate[]>(DEFAULT_TEMPLATES);
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [previewDialog, setPreviewDialog] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
    const [processing, setProcessing] = useState(false);

    // Form state
    const [form, setForm] = useState({
        name: '',
        slug: '',
        subject: '',
        body: '',
        category: 'notification',
        is_active: true,
    });

    function openPreview(template: EmailTemplate) {
        setSelectedTemplate(template);
        setPreviewDialog(true);
    }

    function openEdit(template: EmailTemplate) {
        setForm({
            name: template.name,
            slug: template.slug,
            subject: template.subject,
            body: template.body,
            category: template.category,
            is_active: template.is_active,
        });
        setSelectedTemplate(template);
        setDialogOpen(true);
    }

    function handleCreate() {
        // Would save to database
        alert('Template saved! In production, this would persist to the email_templates table.');
        setDialogOpen(false);
        setForm({ name: '', slug: '', subject: '', body: '', category: 'notification', is_active: true });
        setSelectedTemplate(null);
    }

    function copyVariables(template: EmailTemplate) {
        const vars = template.variables.map(v => `{{${v}}}`).join(', ');
        navigator.clipboard.writeText(vars);
        alert('Variables copied to clipboard!');
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Email Templates</h1>
                    <p className="text-muted-foreground">Customize automated email communications</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setSelectedTemplate(null); }}>
                    <DialogTrigger asChild>
                        <Button>
                            <IconPlus className="mr-2 h-4 w-4" />
                            New Template
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{selectedTemplate ? 'Edit' : 'Create'} Email Template</DialogTitle>
                            <DialogDescription>Use variables like {"{{user_name}}"} in your template</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Name</Label>
                                    <Input value={form.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: e.target.value })} placeholder="Welcome Email" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Slug</Label>
                                    <Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="welcome_email" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="welcome">Welcome</SelectItem>
                                        <SelectItem value="payment">Payment</SelectItem>
                                        <SelectItem value="withdrawal">Withdrawal</SelectItem>
                                        <SelectItem value="notification">Notification</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Subject</Label>
                                <Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Welcome to ChronoSnap, {{org_name}}!" />
                            </div>
                            <div className="space-y-2">
                                <Label>Body</Label>
                                <Textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} rows={12} placeholder="Hi {{user_name}},..." className="font-mono text-sm" />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label>Active</Label>
                                <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreate} disabled={!form.name || !form.slug || !form.subject}>
                                {processing ? <IconLoader2 className="h-4 w-4 animate-spin" /> : 'Save Template'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Templates */}
            <div className="grid gap-4 md:grid-cols-2">
                {templates.map((template) => {
                    const cat = CATEGORIES[template.category] || CATEGORIES.notification;
                    return (
                        <Card key={template.id} className="hover:border-violet-500/50 transition-colors">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <IconMail className="h-5 w-5" />
                                        {template.name}
                                    </CardTitle>
                                    <div className="flex items-center gap-2">
                                        <Badge className={cat.color}>{cat.label}</Badge>
                                        {!template.is_active && <Badge variant="secondary">Inactive</Badge>}
                                    </div>
                                </div>
                                <CardDescription className="font-mono text-xs">{template.slug}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-sm font-medium mb-1">Subject:</p>
                                    <p className="text-sm text-muted-foreground">{template.subject}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium mb-1">Variables:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {template.variables.map(v => (
                                            <Badge key={v} variant="outline" className="font-mono text-xs">{`{{${v}}}`}</Badge>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button size="sm" variant="outline" onClick={() => openPreview(template)}>
                                        <IconEye className="h-4 w-4 mr-1" />Preview
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => openEdit(template)}>
                                        <IconEdit className="h-4 w-4 mr-1" />Edit
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => copyVariables(template)}>
                                        <IconCopy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Preview Dialog */}
            <Dialog open={previewDialog} onOpenChange={setPreviewDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Preview: {selectedTemplate?.name}</DialogTitle>
                    </DialogHeader>
                    {selectedTemplate && (
                        <div className="space-y-4">
                            <div className="p-4 bg-accent rounded-lg">
                                <p className="text-sm font-medium mb-1">Subject:</p>
                                <p>{selectedTemplate.subject.replace(/\{\{(\w+)\}\}/g, '[$1]')}</p>
                            </div>
                            <div className="p-4 bg-accent rounded-lg">
                                <p className="text-sm font-medium mb-2">Body:</p>
                                <pre className="whitespace-pre-wrap text-sm font-mono">
                                    {selectedTemplate.body.replace(/\{\{(\w+)\}\}/g, '[$1]')}
                                </pre>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPreviewDialog(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
