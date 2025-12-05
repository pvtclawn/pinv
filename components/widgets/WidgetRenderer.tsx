import { Widget } from '@/types';
import SandboxRunner from '@/components/SandboxRunner';

export default function WidgetRenderer({ widget }: { widget: Widget }) {
    // In Phase 3, all widgets are programmable and run in the sandbox
    return <SandboxRunner code={widget.code} />;
}
