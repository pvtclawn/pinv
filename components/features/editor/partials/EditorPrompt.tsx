"use client";

import { useState, useCallback, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import CopyButton from "@/components/shared/CopyButton"; // Can be removed if unused, but FloatingActions uses it internally? No, FloatingActions imports it.
import { FloatingActions } from "./FloatingActions";
import { cn } from "@/lib/utils";

interface EditorPromptProps {
    prompt: string;
    setPrompt: (value: string) => void;
    isGenerating: boolean;
    isConnected: boolean;
    hasGenerated: boolean;
    error: string | null;
    onGenerate: () => void;
    onBack: () => void;
}

export function EditorPrompt({
    prompt,
    setPrompt,
    isGenerating,
    isConnected,
    hasGenerated,
    error,
    onGenerate,
    onBack
}: EditorPromptProps) {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Create a portal for fullscreen mode
    const FullscreenPortal = useCallback(({ children }: { children: React.ReactNode }) => {
        if (typeof window === 'undefined') return null;
        return require('react-dom').createPortal(
            <div className="fixed inset-0 z-9999 bg-background flex flex-col h-screen w-screen">
                {children}
            </div>,
            document.body
        );
    }, []);

    const content = (
        <div className={cn(
            "relative flex flex-col bg-muted/30 overflow-hidden transition-all duration-200",
            isFullscreen ? "fixed inset-0 z-50 h-full w-full rounded-none" : "w-full rounded-none"
        )}>
            {/* Textarea Container */}
            <div className={cn(
                "relative w-full bg-transparent",
                isFullscreen ? "flex-1 h-full" : "h-[200px]"
            )}>
                <FloatingActions
                    content={prompt}
                    isFullscreen={isFullscreen}
                    onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
                />
                <Textarea
                    placeholder="Describe the widget you want to generate..."
                    className={cn(
                        "w-full h-full resize-none border-0 focus-visible:ring-0 p-4 font-normal leading-relaxed bg-transparent",
                        isFullscreen ? "text-lg" : "text-base"
                    )}
                    value={prompt}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
                    disabled={!isConnected || isGenerating}
                />
            </div>
        </div>
    );

    return (
        <div>
            {isFullscreen ? (
                <>
                    <div className="h-[240px]" /> {/* Placeholder to prevent layout jump */}
                    <FullscreenPortal>{content}</FullscreenPortal>
                </>
            ) : content}

            {!isConnected && (
                <p className="text-destructive text-sm font-bold">Please connect wallet.</p>
            )}
            {error && (
                <p className="text-destructive text-sm font-bold">{error}</p>
            )}
            <div className="flex gap-4">
                {!hasGenerated && (
                    <Button
                        variant="ghost"
                        onClick={onBack}
                        className="flex-1"
                    >
                        Back
                    </Button>
                )}
                <Button
                    onClick={onGenerate}
                    disabled={isGenerating || !isConnected || !prompt.trim()}
                    isLoading={isGenerating}
                    className="flex-1"
                    icon={Wand2}
                >
                    {hasGenerated ? "REFINE" : "CONSTRUCT"}
                </Button>
            </div>
        </div>
    );
}
