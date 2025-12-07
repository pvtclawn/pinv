"use client";

import ShareButton from "@/components/ShareButton";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface ParameterDefinition {
    name: string;
    description?: string;
    type?: "user_setting" | "dynamic_context" | string;
}

interface PinParamsProps {
    parameters: ParameterDefinition[];
    mode: 'view' | 'edit';
    values?: Record<string, string>;
    onChange?: (values: Record<string, string>) => void;
    baseUrl?: string;
    initialValues?: Record<string, string>;
    className?: string;
    disabled?: boolean;
}

/**
 * PinParams - Unified component for displaying and editing pin parameters.
 * Handles both the "view" mode (Share button) and "edit" mode (Inputs).
 */
export default function PinParams({
    parameters,
    mode,
    values: externalValues,
    initialValues,
    onChange,
    baseUrl,
    className,
    disabled = false
}: PinParamsProps) {
    // In edit mode, use controlled values
    const values = mode === 'edit' ? (externalValues || {}) : (initialValues || {});

    const handleChange = (name: string, value: string) => {
        if (mode === 'edit' && onChange) {
            onChange({ ...values, [name]: value });
        }
    };

    // Build share URL for view mode
    const getShareUrl = () => {
        if (!baseUrl) return '';
        const url = new URL(baseUrl);
        Object.entries(values).forEach(([key, value]) => {
            if (value) url.searchParams.set(key, value);
        });
        return url.toString();
    };

    if (!parameters || parameters.length === 0) {
        if (mode === 'view' && baseUrl) {
            return <ShareButton url={baseUrl} />;
        }
        return <p className="text-sm text-muted-foreground">No configurable parameters.</p>;
    }

    return (
        <div className={cn("space-y-6 w-full", className)}>
            <div className={cn("grid gap-4", mode === 'view' ? "p-4 border rounded-none bg-muted/20" : "")}>
                {parameters.map((param) => (
                    <div key={param.name} className="space-y-2">
                        <Label htmlFor={param.name}>
                            {param.name}
                        </Label>
                        <Input
                            id={param.name}
                            placeholder={param.description || `Enter ${param.name}...`}
                            value={values[param.name] || ""}
                            onChange={(e) => handleChange(param.name, e.target.value)}
                            className="bg-background"
                            disabled={disabled || (mode === 'view' && !onChange)}
                        />
                        {param.description && (
                            <p className="text-xs text-muted-foreground">
                                {param.description}
                            </p>
                        )}
                    </div>
                ))}
            </div>

            {mode === 'view' && baseUrl && (
                <div className="flex gap-4">
                    <ShareButton url={getShareUrl()} />
                </div>
            )}
        </div>
    );
}
