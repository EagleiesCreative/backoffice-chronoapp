import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconArrowUpRight, IconArrowDownRight } from "@tabler/icons-react";

interface MetricCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon: React.ReactNode;
    trend?: {
        value: number;
        label: string;
        isPositive: boolean;
    };
    className?: string;
}

export function MetricCard({
    title,
    value,
    description,
    icon,
    trend,
    className,
}: MetricCardProps) {
    return (
        <Card className={cn("overflow-hidden", className)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    {icon}
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {(description || trend) && (
                    <div className="flex items-center gap-2 mt-1">
                        {trend && (
                            <span
                                className={cn(
                                    "flex items-center text-xs font-medium",
                                    trend.isPositive ? "text-green-500" : "text-red-500"
                                )}
                            >
                                {trend.isPositive ? (
                                    <IconArrowUpRight className="h-3 w-3 mr-0.5" />
                                ) : (
                                    <IconArrowDownRight className="h-3 w-3 mr-0.5" />
                                )}
                                {trend.value}%
                            </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                            {trend?.label || description}
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
