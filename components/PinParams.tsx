"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ShareButton from "@/components/ShareButton";
import { cn } from "@/lib/utils";

interface Parameter {
    name: string;
    description?: string;
    type?: string;
}

interface PinParamsProps {
    parameters: Parameter[];
    mode: 'view' | 'edit';
    // For Controlled Mode (Edit)
    values?: Record<string, string>;
    onChange?: (values: Record<string, string>) => void;
    // For View Mode
    baseUrl?: string;
    initialValues?: Record<string, string>;
    className?: string;
}

export default function PinParams({
    parameters,
    mode,
    values: externalValues,
    initialValues,
    onChange,
    baseUrl,
    className
}: PinParamsProps) {
    const [internalValues, setInternalValues] = useState<Record<string, string>>(initialValues || {});

    // In 'edit' mode, use externalValues (Controlled). In 'view' mode, use internalValues (Uncontrolled with initial).
    const values = mode === 'edit' ? (externalValues || {}) : internalValues;

    const handleChange = (name: string, value: string) => {
        const newValues = { ...values, [name]: value };

        if (mode === 'edit' && onChange) {
            onChange(newValues);
        } else {
            setInternalValues(newValues);
        }
    };

    // Construct the dynamic URL for View mode
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
            <div className={cn("grid gap-4", mode === 'view' ? "p-4 border rounded-lg bg-muted/20" : "")}>
                {mode === 'view' && (
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                        Customize View
                    </h3>
                )}

                {parameters.map((param) => (
                    <div key={param.name} className="space-y-2">
                        <Label htmlFor={param.name} className={mode === 'view' ? "text-xs uppercase opacity-70" : ""}>
                            {param.name}
                        </Label>
                        <Input
                            id={param.name}
                            placeholder={param.description || `Enter ${param.name}...`}
                            value={values[param.name] || ""}
                            onChange={(e) => handleChange(param.name, e.target.value)}
                            className="bg-background"
                        />
                        {mode === 'edit' && param.description && (
                            <p className="text-xs text-muted-foreground">{param.description}</p>
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
