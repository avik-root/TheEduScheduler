
'use server';

import { redirect } from 'next/navigation';
import { addFacultyLog } from './logs';

export async function handleFacultyLogout(adminEmail: string, facultyName: string, facultyEmail: string) {
    if (adminEmail && facultyEmail && facultyName) {
        await addFacultyLog(adminEmail, facultyName, facultyEmail, 'logout');
    }
    redirect('/teacher/login');
}
