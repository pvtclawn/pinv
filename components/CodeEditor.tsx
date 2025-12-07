"use client";

import { useState, useCallback } from "react";
import Editor from "react-simple-code-editor";
import { Highlight, themes } from "prism-react-renderer";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeEditorProps {
    value: string;
    onChange: (value: string) => void;
    language?: "javascript" | "jsx" | "typescript" | "tsx";
    placeholder?: string;
    className?: string;
    minHeight?: string;
}

/**
 * Lightweight code editor with syntax highlighting.
 * Uses react-simple-code-editor + prism-react-renderer.
 * 
 * Features:
 * - Syntax highlighting for JS/JSX
 * - Fullscreen toggle
 * - Dark theme
 */
export default function CodeEditor({
    value,
    onChange,
    language = "javascript",
    placeholder = "Enter code...",
    className,
    minHeight = "250px",
}: CodeEditorProps) {
    const [isFullscreen, setIsFullscreen] = useState(false);

    const highlightCode = useCallback((code: string) => (
        <Highlight
            theme={themes.nightOwl}
            code={code}
            language={language}
        >
            {({ tokens, getLineProps, getTokenProps }) => (
                <>
                    {tokens.map((line, i) => (
                        <div key={i} {...getLineProps({ line })}>
                            {line.map((token, key) => (
                                <span key={key} {...getTokenProps({ token })} />
                            ))}
                        </div>
                    ))}
                </>
            )}
        </Highlight>
    ), [language]);

    // Create a portal for fullscreen mode to break out of stacking contexts
    const FullscreenPortal = useCallback(({ children }: { children: React.ReactNode }) => {
        if (typeof window === 'undefined') return null;
        return require('react-dom').createPortal(
            <div className="fixed inset-0 z-[99999] bg-[#011627] flex flex-col h-screen w-screen">
                {children}
            </div>,
            document.body
        );
    }, []);

    const content = (
        <div className={cn(
            "relative rounded-none overflow-hidden border border-slate-700 bg-[#011627]",
            isFullscreen ? "border-0 flex-1 flex flex-col h-full w-full" : className
        )}>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-800 border-b border-slate-700 shrink-0">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-mono">
                    {language}
                </span>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            navigator.clipboard.writeText(value);
                        }}
                        className="h-6 w-6 p-0 text-slate-400 hover:text-white hover:bg-slate-700"
                        title="Copy code"
                    >
                        <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="h-6 w-6 p-0 text-slate-400 hover:text-white hover:bg-slate-700"
                        title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                    >
                        {isFullscreen ? (
                            <Minimize2 className="h-4 w-4" />
                        ) : (
                            <Maximize2 className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-auto relative bg-[#011627]">
                <Editor
                    value={value}
                    onValueChange={onChange}
                    highlight={highlightCode}
                    padding={16}
                    placeholder={placeholder}
                    style={{
                        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                        fontSize: 13,
                        lineHeight: 1.5,
                        backgroundColor: "#011627",
                        color: "#d6deeb",
                        minHeight: isFullscreen ? "100%" : minHeight,
                    }}
                    textareaClassName="focus:outline-none !whitespace-pre"
                    className="min-h-full !whitespace-pre"
                />
            </div>
        </div>
    );

    if (isFullscreen) {
        return (
            <>
                <div style={{ height: minHeight }} /> {/* Placeholder */}
                <FullscreenPortal>{content}</FullscreenPortal>
            </>
        );
    }

    return content;
}
