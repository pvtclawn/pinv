"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { useAccount } from "wagmi";
import { Pin } from "@/types";
import { Loader2, Wand2, Save, ScanFace } from "lucide-react";
import Link from "next/link";

interface EditPinFormProps {
    fid: number;
    pin: Pin | null;
}

export default function EditPinForm({ fid, pin }: EditPinFormProps) {
    const { isConnected } = useAccount();
    // const isConnected = true; // MOCKED FOR VERIFICATION
    const router = useRouter();

    const [prompt, setPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [hasGenerated, setHasGenerated] = useState(false);
    const [litActionCode, setLitActionCode] = useState("");
    const [reactCode, setReactCode] = useState("");
    const [parameters, setParameters] = useState<any[]>([]);
    const [previewData, setPreviewData] = useState<any>({});
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);

    // AI Generation
    const handleUpdate = async () => {
        if (!prompt) return;
        setIsGenerating(true);
        setHasGenerated(false);
        setPreviewImageUrl(null);

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to generate');
            }

            const data = await response.json();

            setLitActionCode(data.lit_action_code);
            setReactCode(data.react_code);
            setParameters(data.parameters || []);
            setPreviewData(data.preview_data || {});
            setHasGenerated(true);

            // Auto-trigger preview render
            renderPreview(data.react_code, data.preview_data);

        } catch (error) {
            console.error('Generation failed:', error);
            alert("Generation failed. Check console/network.");
        } finally {
            setIsGenerating(false);
        }
    };

    const renderPreview = async (code: string, data: any) => {
        setIsPreviewLoading(true);
        try {
            const response = await fetch('/api/preview-widget', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, props: data }),
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                setPreviewImageUrl(url);
            }
        } catch (error) {
            console.error("Preview render failed:", error);
        } finally {
            setIsPreviewLoading(false);
        }
    };

    const handleSave = () => {
        // Logic to save the widget (MVP: Alert)
        alert("Pin Saved (Mock)!");
        router.push(`/p/${fid}`);
    };

    return (
        <div className="max-w-[1600px] mx-auto p-4 md:p-8">
            <Header />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 min-h-[calc(100vh-200px)]">
                {/* Left Column: Controls */}
                <div className="flex flex-col gap-6 overflow-y-auto pr-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pin Prompt</CardTitle>
                            <CardDescription>Describe what you want this pin to do.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea
                                placeholder="e.g. show the price of ETH from CoinGecko..."
                                className="min-h-[120px]"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                disabled={!isConnected || isGenerating}
                            />
                            {!isConnected && <p className="text-red-500 text-sm">Please connect wallet.</p>}
                            <Button
                                onClick={handleUpdate}
                                disabled={isGenerating || !isConnected || !prompt}
                                className="w-full"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="mr-2 h-4 w-4" />
                                        Generate Widget
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    {hasGenerated && (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Parameters</CardTitle>
                                    <CardDescription>Test input values for your widget.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {parameters.length === 0 && <p className="text-sm text-muted-foreground">No parameters detected.</p>}
                                    {parameters.map((param, idx) => (
                                        <div key={idx} className="space-y-2">
                                            <Label>{param.name} <span className="text-xs text-muted-foreground">({param.type})</span></Label>
                                            <Input
                                                value={previewData[param.name] || ''}
                                                onChange={(e) => {
                                                    const newData = { ...previewData, [param.name]: e.target.value };
                                                    setPreviewData(newData);
                                                }}
                                            />
                                            <p className="text-xs text-muted-foreground">{param.description}</p>
                                        </div>
                                    ))}
                                    <Button variant="outline" size="sm" onClick={() => renderPreview(reactCode, previewData)} disabled={isPreviewLoading}>
                                        {isPreviewLoading ? "Rendering..." : "Refresh Preview"}
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Generated Code</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Tabs defaultValue="react">
                                        <TabsList className="w-full">
                                            <TabsTrigger value="react" className="flex-1">React (UI)</TabsTrigger>
                                            <TabsTrigger value="lit" className="flex-1">Lit Action (Data)</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="react">
                                            <Textarea value={reactCode} readOnly className="font-mono text-xs h-[200px]" />
                                        </TabsContent>
                                        <TabsContent value="lit">
                                            <Textarea value={litActionCode} readOnly className="font-mono text-xs h-[200px]" />
                                        </TabsContent>
                                    </Tabs>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>

                {/* Right Column: Preview */}
                <div className="flex flex-col gap-6">
                    <Card className="h-full flex flex-col">
                        <CardHeader>
                            <CardTitle>Live Preview</CardTitle>
                            <CardDescription>Target: 1200x800px (Farcaster Embed)</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 flex items-center justify-center bg-muted/20 rounded-lg m-6 border-2 border-dashed relative overflow-hidden min-h-[400px]">
                            {previewImageUrl ? (
                                <img src={previewImageUrl} alt="Widget Preview" className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" />
                            ) : (
                                <div className="text-center text-muted-foreground">
                                    <ScanFace className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>Generate a widget to see preview</p>
                                </div>
                            )}
                            {isPreviewLoading && (
                                <div className="absolute inset-0 bg-background/50 flex items-center justify-center backdrop-blur-sm">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="justify-end border-t p-6">
                            <div className="flex gap-4">
                                <Button variant="ghost" asChild>
                                    <Link href={`/p/${fid}`}>Cancel</Link>
                                </Button>
                                <Button onClick={handleSave} disabled={!hasGenerated}>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Pin
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
