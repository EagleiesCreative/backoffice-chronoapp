"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    IconLayoutDashboard,
    IconBuilding,
    IconUsers,
    IconDeviceDesktop,
    IconCreditCard,
    IconCash,
    IconReceipt2,
    IconChartBar,
    IconSettings,
    IconServer,
    IconChevronLeft,
    IconChevronRight,
    IconClipboardList,
    IconFileSpreadsheet,
    IconSpeakerphone,
    IconHeadset,
    IconTrendingUp,
    IconTool,
    IconChecklist,
    IconMail,
    IconSettingsAutomation,
} from "@tabler/icons-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

const navigation = [
    {
        title: "Overview",
        items: [
            { name: "Dashboard", href: "/", icon: IconLayoutDashboard },
        ],
    },
    {
        title: "Management",
        items: [
            { name: "Organizations", href: "/organizations", icon: IconBuilding },
            { name: "Users", href: "/users", icon: IconUsers },
            { name: "Booths", href: "/booths", icon: IconDeviceDesktop },
        ],
    },
    {
        title: "Financial",
        items: [
            { name: "Payments", href: "/payments", icon: IconCreditCard },
            { name: "Withdrawals", href: "/withdrawals", icon: IconCash },
            { name: "Subscriptions", href: "/subscriptions", icon: IconReceipt2 },
        ],
    },
    {
        title: "Insights",
        items: [
            { name: "Analytics", href: "/analytics", icon: IconChartBar },
            { name: "Booth Performance", href: "/booth-performance", icon: IconTrendingUp },
            { name: "Reports", href: "/reports", icon: IconFileSpreadsheet },
        ],
    },
    {
        title: "Operations",
        items: [
            { name: "Broadcasts", href: "/broadcasts", icon: IconSpeakerphone },
            { name: "Support", href: "/support", icon: IconHeadset },
            { name: "Remote Config", href: "/remote-config", icon: IconSettingsAutomation },
            { name: "Maintenance", href: "/maintenance", icon: IconTool },
            { name: "Bulk Actions", href: "/bulk-actions", icon: IconChecklist },
        ],
    },
    {
        title: "System",
        items: [
            { name: "System Health", href: "/system", icon: IconServer },
            { name: "Email Templates", href: "/email-templates", icon: IconMail },
            { name: "Audit Logs", href: "/audit-logs", icon: IconClipboardList },
            { name: "Settings", href: "/settings", icon: IconSettings },
        ],
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <TooltipProvider delayDuration={0}>
            <aside
                className={cn(
                    "relative flex flex-col border-r border-border bg-card transition-all duration-300",
                    collapsed ? "w-16" : "w-64"
                )}
            >
                {/* Header */}
                <div className={cn(
                    "flex h-16 items-center border-b border-border px-4",
                    collapsed ? "justify-center" : "gap-3"
                )}>
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
                        <svg
                            className="h-5 w-5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                        </svg>
                    </div>
                    {!collapsed && (
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold">ChronoSnap</span>
                            <span className="text-xs text-muted-foreground">Admin</span>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <ScrollArea className="flex-1 py-4">
                    <nav className="space-y-6 px-3">
                        {navigation.map((section) => (
                            <div key={section.title}>
                                {!collapsed && (
                                    <h3 className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                        {section.title}
                                    </h3>
                                )}
                                <div className="space-y-1">
                                    {section.items.map((item) => {
                                        const isActive = pathname === item.href ||
                                            (item.href !== "/" && pathname.startsWith(item.href));

                                        const linkContent = (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                className={cn(
                                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                                    isActive
                                                        ? "bg-primary text-primary-foreground"
                                                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                                                    collapsed && "justify-center px-2"
                                                )}
                                            >
                                                <item.icon className="h-5 w-5 flex-shrink-0" />
                                                {!collapsed && <span>{item.name}</span>}
                                            </Link>
                                        );

                                        if (collapsed) {
                                            return (
                                                <Tooltip key={item.name}>
                                                    <TooltipTrigger asChild>
                                                        {linkContent}
                                                    </TooltipTrigger>
                                                    <TooltipContent side="right">
                                                        {item.name}
                                                    </TooltipContent>
                                                </Tooltip>
                                            );
                                        }

                                        return linkContent;
                                    })}
                                </div>
                                {section !== navigation[navigation.length - 1] && !collapsed && (
                                    <Separator className="mt-4" />
                                )}
                            </div>
                        ))}
                    </nav>
                </ScrollArea>

                {/* Collapse Button */}
                <div className="border-t border-border p-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCollapsed(!collapsed)}
                        className={cn(
                            "w-full justify-center",
                            collapsed ? "px-2" : "px-3"
                        )}
                    >
                        {collapsed ? (
                            <IconChevronRight className="h-4 w-4" />
                        ) : (
                            <>
                                <IconChevronLeft className="h-4 w-4 mr-2" />
                                <span>Collapse</span>
                            </>
                        )}
                    </Button>
                </div>
            </aside>
        </TooltipProvider>
    );
}
