
import Link from 'next/link';
import Image from 'next/image';
import { CalendarCog } from 'lucide-react';
import { getLogo } from '@/lib/logo';
import { cn } from '@/lib/utils';

interface AppLogoProps {
    className?: string;
    iconClassName?: string;
    textClassName?: string;
    linkTo: string;
}

export async function AppLogo({ className, iconClassName, textClassName, linkTo }: AppLogoProps) {
    const logoUrl = await getLogo();

    return (
        <Link href={linkTo} className={cn("flex items-center gap-3", className)}>
            {logoUrl ? (
                <div className={cn("relative h-8 w-8", iconClassName)}>
                    <Image src={logoUrl} alt="EduScheduler Logo" fill className="object-contain"/>
                </div>
            ) : (
                <CalendarCog className={cn("h-8 w-8 text-primary", iconClassName)} />
            )}
            <span className={cn("text-2xl font-bold text-primary", textClassName)}>
                EduScheduler <span className="text-sm font-normal text-muted-foreground">by MintFire</span>
            </span>
        </Link>
    );
}
