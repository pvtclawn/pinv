import { cn } from "@/lib/utils";

interface AppCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    noHover?: boolean;
}

export function AppCard({ children, className, noHover = false, ...props }: AppCardProps) {
    return (
        <div
            className={cn(
                "origami-card bg-white p-6 relative overflow-hidden",
                noHover && "hover:transform-none hover:shadow-[0_1px_0_0_rgba(0,0,0,0.05)]",
                className
            )}
            {...props}
        >

            {children}
        </div>
    );
}
