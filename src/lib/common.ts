'use server';

import path from 'path';

export async function getAdminDataPath(adminEmail: string): Promise<string> {
    const sanitizedEmail = adminEmail.replace(/[^a-zA-Z0-9._-]/g, '_');
    return path.join(process.cwd(), 'src', 'data', 'admins', sanitizedEmail);
}
