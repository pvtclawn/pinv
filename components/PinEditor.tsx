'use client';

import { useState } from 'react';
import { Pin, Widget } from '@/types';
import WidgetRenderer from './widgets/WidgetRenderer';
import { useAccount } from 'wagmi';
import { blockchainService } from '@/lib/blockchain-service';

export default function PinEditor({ pin }: { pin: Pin }) {
    const { isConnected } = useAccount();
    const [isEditing, setIsEditing] = useState(false);
    const [widgets, setWidgets] = useState<Widget[]>(pin.widgets || []);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Simulate on-chain transaction
            await blockchainService.updatePin(pin.fid, { widgets });
            setIsEditing(false);
            alert('Pin updated on-chain! (Mock)');
        } catch (e) {
            console.error(e);
            alert('Failed to update pin');
        } finally {
            setIsSaving(false);
        }
    };

    const moveWidget = (index: number, direction: 'up' | 'down') => {
        const newWidgets = [...widgets];
        if (direction === 'up' && index > 0) {
            [newWidgets[index], newWidgets[index - 1]] = [newWidgets[index - 1], newWidgets[index]];
        } else if (direction === 'down' && index < newWidgets.length - 1) {
            [newWidgets[index], newWidgets[index + 1]] = [newWidgets[index + 1], newWidgets[index]];
        }
        setWidgets(newWidgets);
    };

    const deleteWidget = (index: number) => {
        const newWidgets = [...widgets];
        newWidgets.splice(index, 1);
        setWidgets(newWidgets);
    };

    return (
        <div className="w-full flex flex-col gap-6">
            {/* Controls */}
            <div className="flex justify-end gap-4">
                {isEditing ? (
                    <>
                        <button
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors font-bold"
                        >
                            {isSaving ? 'Signing...' : 'Save Changes'}
                        </button>
                    </>
                ) : (
                    <button
                        onClick={() => setIsEditing(true)}
                        disabled={!isConnected}
                        className={`px-4 py-2 rounded-lg transition-colors font-bold ${isConnected
                            ? 'bg-white/10 hover:bg-white/20'
                            : 'bg-white/5 opacity-50 cursor-not-allowed'
                            }`}
                    >
                        {isConnected ? 'Edit Pin' : 'Connect Wallet to Edit'}
                    </button>
                )}
            </div>

            {/* Widgets List */}
            <div className="flex flex-col gap-8">
                {widgets.map((widget, index) => (
                    <div key={widget.id} className="relative group bg-white/5 rounded-2xl p-4 border border-white/10">
                        {/* Header / Controls */}
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">{widget.title}</h3>
                            {isEditing && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => moveWidget(index, 'up')}
                                        disabled={index === 0}
                                        className="p-1 hover:text-blue-400 disabled:opacity-30"
                                    >
                                        ↑
                                    </button>
                                    <button
                                        onClick={() => moveWidget(index, 'down')}
                                        disabled={index === widgets.length - 1}
                                        className="p-1 hover:text-blue-400 disabled:opacity-30"
                                    >
                                        ↓
                                    </button>
                                    <button
                                        onClick={() => deleteWidget(index)}
                                        className="p-1 hover:text-red-400"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Code Editor (only in edit mode) */}
                        {isEditing ? (
                            <div className="mb-4">
                                <div className="text-xs opacity-50 mb-1 uppercase tracking-wider">React Code</div>
                                <textarea
                                    value={widget.code}
                                    onChange={(e) => {
                                        const newWidgets = [...widgets];
                                        newWidgets[index] = { ...widget, code: e.target.value };
                                        setWidgets(newWidgets);
                                    }}
                                    className="w-full h-64 bg-black/50 text-green-400 font-mono text-sm p-4 rounded-xl border border-white/10 focus:border-blue-500 outline-none resize-y"
                                    spellCheck={false}
                                />
                            </div>
                        ) : null}

                        {/* Live Preview */}
                        <div className="relative">
                            {isEditing && <div className="text-xs opacity-50 mb-1 uppercase tracking-wider">Live Preview</div>}
                            <WidgetRenderer widget={widget} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
