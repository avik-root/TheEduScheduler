'use server';

import { redirect } from 'next/navigation';
import { addFacultyLog } from './logs';
import { headers } from 'next/headers';

export async function handleFacultyLogout(formData: FormData) {
    const adminEmail = formData.get('adminEmail') as string;
    const facultyName = formData.get('facultyName') as string;
    const facultyEmail = formData.get('facultyEmail') as string;
    
    if (adminEmail && facultyEmail && facultyName) {
        const forwarded = headers().get('x-forwarded-for');
        const ip = forwarded ? forwarded.split(/, /)[0] : headers().get('x-real-ip');
        await addFacultyLog(adminEmail, facultyName, facultyEmail, 'logout', ip ?? undefined);
    }
    redirect('/teacher/login');
}
