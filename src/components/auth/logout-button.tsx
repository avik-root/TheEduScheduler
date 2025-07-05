'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Loader2 } from 'lucide-react';
import { handleFacultyLogout } from '@/lib/auth-actions';
import { useFormStatus } from 'react-dom';

interface LogoutButtonProps {
    adminEmail: string;
    facultyName: string;
    facultyEmail: string;
}

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <Button variant="outline" size="icon" type="submit" disabled={pending}>
            {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <LogOut className="h-4 w-4" />
            )}
            <span className="sr-only">Logout</span>
        </Button>
    );
}

export function LogoutButton({ adminEmail, facultyName, facultyEmail }: LogoutButtonProps) {
    const logoutAction = handleFacultyLogout.bind(null, adminEmail, facultyName, facultyEmail);

    return (
        <form action={logoutAction}>
            <SubmitButton />
        </form>
    );
}
