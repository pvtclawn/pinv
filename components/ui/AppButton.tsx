import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface AppButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    className?: string;
    variant?: "primary" | "secondary" | "ghost" | "outline";
    isLoading?: boolean;
    loadingText?: string;
    icon?: React.ElementType;
    asChild?: boolean;
}

export function AppButton({
    children,
    className,
    variant = "primary",
    isLoading = false,
    loadingText,
    icon: Icon,
    ...props
}: AppButtonProps) {

    const variantStyles = {
        primary: "bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg border-transparent",
        secondary: "bg-[#111218] hover:bg-[#111218]/90 text-white border border-white/10",
        ghost: "bg-transparent hover:bg-muted/10 text-muted-foreground hover:text-primary border-transparent",
        outline: "bg-transparent border border-border text-foreground hover:bg-muted/10 hover:border-primary",
    };

    return (
        <Button
            className={cn(
                "rounded-none font-bold uppercase tracking-wider h-10 md:h-12 px-2 md:px-6 text-xs md:text-sm transition-all duration-200",
                variantStyles[variant],
                className
            )}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {loadingText || children}
                </>
            ) : Icon ? (
                <>
                    <Icon className="mr-2 h-4 w-4" />
                    {children}
                </>
            ) : (
                children
            )}
        </Button>
    );
}
