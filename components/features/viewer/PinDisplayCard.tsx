import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader } from "@/components/ui/Loader";
import { ScanFace } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

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
    const [isImageLoaded, setIsImageLoaded] = useState(false);

    // Reset loading state when source changes
    useEffect(() => {
        setIsImageLoaded(false);
    }, [imageSrc]);

    return (
        <Card className={cn("h-full flex flex-col shadow-lg rounded-none", className)} {...props}>
            <CardHeader className="text-center md:text-left bg-muted/10 px-6 pt-2 pb-0">
                <div className="space-y-2">
                    <CardTitle className="text-xl md:text-2xl font-bold font-sans">{title}</CardTitle>
                    <CardDescription className="text-sm md:text-base">{description}</CardDescription>
                </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 relative min-h-0 bg-muted/10 w-full aspect-3/2">
                {/* Image Container */}
                <div className="absolute inset-0 w-full h-full flex items-center justify-center p-0 overflow-hidden">
                    {imageSrc ? (
                        <>
                            <img
                                src={imageSrc}
                                alt="Pin Preview"
                                className={cn(
                                    "w-full h-full object-cover shadow-md rounded-none transition-opacity duration-300",
                                    "opacity-100"
                                )}
                                onLoad={() => setIsImageLoaded(true)}
                                onError={() => setIsImageLoaded(false)}
                            />
                            {(!isImageLoaded || isLoading) && (
                                <Loader variant="thumbnail" />
                            )}
                        </>
                    ) : (
                        <Loader variant="thumbnail" />
                    )}
                </div>
            </CardContent>

            {(children) && (
                <CardFooter className={cn("flex flex-col gap-4 bg-muted/5 px-4 pb-4 pt-0 md:px-6 md:pb-6 md:pt-0", footerClassName)}>
                    {children}
                </CardFooter>
            )}
        </Card>
    );
}
