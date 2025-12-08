import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ScanFace } from "lucide-react";
import { cn } from "@/lib/utils";

interface PinDisplayCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
    title: React.ReactNode;
    description: React.ReactNode;
    imageSrc?: string | null;
    isLoading?: boolean;
    children?: React.ReactNode;
    // Optional placeholder icon/text overrides
    placeholderIcon?: React.ElementType;
    placeholderText?: string;
    footerClassName?: string;
}

export default function PinDisplayCard({
    title,
    description,
    imageSrc,
    isLoading = false,
    children,
    className,
    placeholderIcon: PlaceholderIcon = ScanFace,
    placeholderText = "No preview available",
    footerClassName,
    ...props
}: PinDisplayCardProps) {
    return (
        <Card className={cn("h-full flex flex-col shadow-lg rounded-none", className)} {...props}>
            <CardHeader className="text-center md:text-left bg-muted/10 border-b p-4">
                <CardTitle className="text-xl md:text-2xl font-bold font-sans">{title}</CardTitle>
                <CardDescription className="text-sm md:text-base">{description}</CardDescription>
            </CardHeader>

            <CardContent className="flex-1 p-0 relative min-h-[0px] bg-muted/10 w-full aspect-[3/2]">
                {/* Image Container */}
                <div className="absolute inset-0 w-full h-full flex items-center justify-center p-0">
                    {imageSrc ? (
                        <img
                            src={imageSrc}
                            alt="Pin Preview"
                            className="w-full h-full object-cover shadow-md rounded-none"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted/10">
                            <div className="text-center text-muted-foreground flex flex-col items-center gap-2 animate-pulse">
                                <PlaceholderIcon className="w-12 h-12 opacity-50" />
                                <p>{placeholderText}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Loading Overlay */}
                {isLoading && (
                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center backdrop-blur-sm z-10">
                        <PlaceholderIcon className="w-12 h-12 text-primary animate-pulse" />
                    </div>
                )}
            </CardContent>

            {(children) && (
                <CardFooter className={cn("flex flex-col gap-4 border-t bg-muted/5 p-4 md:p-6", footerClassName)}>
                    {children}
                </CardFooter>
            )}
        </Card>
    );
}
