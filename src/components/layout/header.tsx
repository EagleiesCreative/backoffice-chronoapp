"use client";

import { UserButton } from "@clerk/nextjs";
import { IconBell, IconSearch, IconMoon, IconSun } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

export function Header() {
    const [mounted, setMounted] = useState(false);
    const [isDark, setIsDark] = useState(true);

    useEffect(() => {
        setMounted(true);
        // Check initial theme
        const isDarkMode = document.documentElement.classList.contains("dark");
        setIsDark(isDarkMode);
    }, []);

    const toggleTheme = () => {
        const newIsDark = !isDark;
        setIsDark(newIsDark);
        if (newIsDark) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    };

    return (
        <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 px-6">
            {/* Search */}
            <div className="flex items-center gap-4 flex-1 max-w-md">
                <div className="relative w-full">
                    <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search organizations, users, booths..."
                        className="pl-9 bg-background"
                    />
                </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-3">
                {/* Theme Toggle */}
                <Button variant="ghost" size="icon" onClick={toggleTheme} suppressHydrationWarning>
                    {mounted ? (
                        isDark ? <IconSun className="h-5 w-5" /> : <IconMoon className="h-5 w-5" />
                    ) : (
                        <IconSun className="h-5 w-5" />
                    )}
                </Button>

                {/* Notifications */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative">
                            <IconBell className="h-5 w-5" />
                            <Badge
                                variant="destructive"
                                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                            >
                                3
                            </Badge>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80">
                        <DropdownMenuLabel className="flex items-center justify-between">
                            <span>Notifications</span>
                            <Button variant="ghost" size="sm" className="text-xs">
                                Mark all read
                            </Button>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <div className="max-h-80 overflow-auto">
                            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                                    <span className="font-medium">New withdrawal request</span>
                                </div>
                                <p className="text-sm text-muted-foreground pl-4">
                                    John Doe requested Rp 500.000 withdrawal
                                </p>
                                <span className="text-xs text-muted-foreground pl-4">2 min ago</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-yellow-500" />
                                    <span className="font-medium">Booth offline</span>
                                </div>
                                <p className="text-sm text-muted-foreground pl-4">
                                    Booth &quot;Studio Alpha&quot; has been offline for 30 minutes
                                </p>
                                <span className="text-xs text-muted-foreground pl-4">32 min ago</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-green-500" />
                                    <span className="font-medium">New organization</span>
                                </div>
                                <p className="text-sm text-muted-foreground pl-4">
                                    &quot;Photography Studio&quot; just signed up
                                </p>
                                <span className="text-xs text-muted-foreground pl-4">1 hour ago</span>
                            </DropdownMenuItem>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="justify-center text-primary">
                            View all notifications
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* User Menu */}
                <UserButton
                    appearance={{
                        elements: {
                            avatarBox: "h-9 w-9",
                            userButtonPopoverCard: "bg-card border-border",
                            userButtonPopoverActionButton: "hover:bg-accent",
                        }
                    }}
                    afterSignOutUrl="/sign-in"
                />
            </div>
        </header>
    );
}
