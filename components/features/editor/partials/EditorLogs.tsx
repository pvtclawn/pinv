import React from "react";
import CopyButton from "@/components/shared/CopyButton";
import { cn } from "@/lib/utils";

interface EditorLogsProps {
    logs: string[];
    lastRunTime?: Date | null;
}

export function EditorLogs({ logs, lastRunTime }: EditorLogsProps) {
    const fullLog = logs.join("\n");
    const timeString = lastRunTime ? lastRunTime.toLocaleTimeString() : "--:--:--";

    return (
        <div className="flex flex-col rounded-md border border-border bg-muted/20 overflow-hidden mt-2">
            {/* Header / Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-muted/40 border-b border-border">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                    Updated at {timeString}
                </span>
                {logs.length > 0 && (
                    <CopyButton
                        url={fullLog}
                        variant="ghost"
                        size="icon-sm"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        iconOnly
                    />
                )}
            </div>

            {/* Logs Content - Terminal Style */}
            <div className="relative group">
                {logs.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm font-mono italic select-none">
                        No output to display. Run code to generate logs.
                    </div>
                ) : (
                    <div className="max-h-[300px] overflow-y-auto p-4 font-mono text-xs md:text-sm bg-muted/50 text-foreground select-text rounded-b-md">
                        {logs.map((log, i) => (
                            <div
                                key={i}
                                className="whitespace-pre-wrap break-all border-b border-border/50 py-0.5 last:border-0"
                            >
                                <span className="opacity-50 mr-2 select-none">
                                    {(i + 1).toString().padStart(2, '0')}
                                </span>
                                {log}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
