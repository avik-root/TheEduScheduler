import { getVersion } from '@/lib/version';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export async function VersionBadge() {
    const { version, status } = await getVersion();
    const isBeta = status === 'Beta';

    return (
        <Badge variant="outline" className={cn(
            "text-xs font-semibold border-2",
            isBeta ? "border-red-500/50 text-red-500" : "border-green-500/50 text-green-500"
        )}>
            <span className="mr-1.5">V {version}</span>
            <span className="flex items-center gap-1">
                {isBeta ? <AlertTriangle className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
                {status}
            </span>
        </Badge>
    );
}
