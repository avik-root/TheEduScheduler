
'use server';

import fs from 'fs/promises';
import path from 'path';
import { getAdminDataPath } from './common';

const logsFileName = 'faculty-logs.json';

export interface FacultyLog {
    id: string;
    facultyName: string;
    facultyEmail: string;
    timestamp: string;
    type: 'login';
}

async function getLogsFilePath(adminEmail: string): Promise<string> {
    const adminDataPath = await getAdminDataPath(adminEmail);
    await fs.mkdir(adminDataPath, { recursive: true });
    return path.join(adminDataPath, logsFileName);
}

async function readLogsFile(adminEmail: string): Promise<FacultyLog[]> {
    try {
        const filePath = await getLogsFilePath(adminEmail);
        await fs.access(filePath);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        if (!fileContent.trim()) {
            return [];
        }
        return JSON.parse(fileContent);
    } catch (error) {
        return [];
    }
}

async function writeLogsFile(adminEmail: string, logs: FacultyLog[]): Promise<void> {
    const filePath = await getLogsFilePath(adminEmail);
    await fs.writeFile(filePath, JSON.stringify(logs, null, 2));
}

export async function getFacultyLogs(adminEmail: string): Promise<FacultyLog[]> {
    if (!adminEmail) return [];
    const logs = await readLogsFile(adminEmail);
    // Sort by most recent first
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function addLoginLog(adminEmail: string, facultyName: string, facultyEmail: string): Promise<void> {
    const logs = await readLogsFile(adminEmail);
    const newLog: FacultyLog = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        facultyName,
        facultyEmail,
        timestamp: new Date().toISOString(),
        type: 'login',
    };
    
    // Keep the log file from growing indefinitely, cap at 100 entries
    const updatedLogs = [newLog, ...logs].slice(0, 100);

    try {
        await writeLogsFile(adminEmail, updatedLogs);
    } catch (error) {
        console.error('Failed to add login log:', error);
    }
}
