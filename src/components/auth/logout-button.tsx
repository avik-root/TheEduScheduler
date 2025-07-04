
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Loader2 } from 'lucide-react';
import { handleFacultyLogout } from '@/lib/auth-actions';

interface LogoutButtonProps {
    adminEmail: string;
    facultyName: string;
    facultyEmail: string;
}

export function LogoutButton({ adminEmail, facultyName, facultyEmail }: LogoutButtonProps) {
    const [isLoggingOut, setIsLoggingOut] = React.useState(false);

    const onLogout = async () => {
        setIsLoggingOut(true);
        await handleFacultyLogout(adminEmail, facultyName, facultyEmail);
    };

    return (
        <form action={onLogout}>
            <Button variant="outline" size="icon" type="submit" disabled={isLoggingOut}>
                {isLoggingOut ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <LogOut className="h-4 w-4" />
                )}
                <span className="sr-only">Logout</span>
            </Button>
        </form>
    );
}
