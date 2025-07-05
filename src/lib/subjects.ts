
'use server';

import fs from 'fs/promises';
import path from 'path';
import type { z } from 'zod';
import { SubjectSchema, UpdateSubjectSchema } from '@/lib/validators/auth';
import { getAdminDataPath } from './common';

const subjectsFileName = 'subjects.json';

export type Subject = z.infer<typeof UpdateSubjectSchema>;
type SubjectData = z.infer<typeof SubjectSchema>;

async function getSubjectsFilePath(adminEmail: string): Promise<string> {
    const adminDataPath = await getAdminDataPath(adminEmail);
    await fs.mkdir(adminDataPath, { recursive: true });
    return path.join(adminDataPath, subjectsFileName);
}

async function readSubjectsFile(adminEmail: string): Promise<Subject[]> {
    try {
        const filePath = await getSubjectsFilePath(adminEmail);
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

async function writeSubjectsFile(adminEmail: string, subjects: Subject[]): Promise<void> {
    const filePath = await getSubjectsFilePath(adminEmail);
    await fs.writeFile(filePath, JSON.stringify(subjects, null, 2));
}

export async function getSubjects(adminEmail: string): Promise<Subject[]> {
    if (!adminEmail) return [];
    return await readSubjectsFile(adminEmail);
}

export async function createSubject(adminEmail: string, data: SubjectData): Promise<{ success: boolean; message: string }> {
    const subjects = await readSubjectsFile(adminEmail);

    const existingSubject = subjects.find(s => s.code === data.code);
    if (existingSubject) {
        return { success: false, message: 'A subject with this code already exists.' };
    }

    const newSubject: Subject = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        ...data,
    };

    subjects.push(newSubject);

    try {
        await writeSubjectsFile(adminEmail, subjects);
        return { success: true, message: 'Subject created successfully.' };
    } catch (error) {
        console.error('Failed to create subject:', error);
        return { success: false, message: 'An internal error occurred.' };
    }
}

export async function updateSubject(adminEmail: string, data: Subject): Promise<{ success: boolean; message: string }> {
    const subjects = await readSubjectsFile(adminEmail);
    const subjectIndex = subjects.findIndex(s => s.id === data.id);
    if (subjectIndex === -1) {
        return { success: false, message: 'Subject not found.' };
    }

    const existingCode = subjects.find(s => s.code === data.code && s.id !== data.id);
    if (existingCode) {
        return { success: false, message: 'Another subject with this code already exists.' };
    }

    subjects[subjectIndex] = data;

    try {
        await writeSubjectsFile(adminEmail, subjects);
        return { success: true, message: 'Subject updated successfully.' };
    } catch (error) {
        console.error('Failed to update subject:', error);
        return { success: false, message: 'An internal error occurred.' };
    }
}

export async function deleteSubject(adminEmail: string, id: string): Promise<{ success: boolean; message: string }> {
    let subjects = await readSubjectsFile(adminEmail);
    const updatedSubjects = subjects.filter(s => s.id !== id);

    if (subjects.length === updatedSubjects.length) {
         return { success: false, message: 'Subject not found.' };
    }

    try {
        await writeSubjectsFile(adminEmail, updatedSubjects);
        return { success: true, message: 'Subject deleted successfully.' };
    } catch (error) {
        console.error('Failed to delete subject:', error);
        return { success: false, message: 'An internal error occurred.' };
    }
}
