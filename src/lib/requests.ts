
'use server';

import fs from 'fs/promises';
import path from 'path';
import { getAdminDataPath } from './common';

const requestsFileName = 'room-requests.json';

export interface RoomRequest {
    id: string;
    facultyEmail: string;
    facultyName: string;
    roomName: string;
    date: string;
    startTime: string;
    endTime: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    requestedAt: string;
    adminReason?: string;
}

export type RoomRequestData = Omit<RoomRequest, 'id' | 'status' | 'requestedAt'>;

async function getRequestsFilePath(adminEmail: string): Promise<string> {
    const adminDataPath = await getAdminDataPath(adminEmail);
    await fs.mkdir(adminDataPath, { recursive: true });
    return path.join(adminDataPath, requestsFileName);
}

async function readRequestsFile(adminEmail: string): Promise<RoomRequest[]> {
    try {
        const filePath = await getRequestsFilePath(adminEmail);
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

async function writeRequestsFile(adminEmail: string, requests: RoomRequest[]): Promise<void> {
    const filePath = await getRequestsFilePath(adminEmail);
    await fs.writeFile(filePath, JSON.stringify(requests, null, 2));
}

export async function getRoomRequests(adminEmail: string): Promise<RoomRequest[]> {
    if (!adminEmail) return [];
    const requests = await readRequestsFile(adminEmail);
    return requests.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
}

export async function getFacultyRoomRequests(adminEmail: string, facultyEmail: string): Promise<RoomRequest[]> {
    if (!adminEmail || !facultyEmail) return [];
    const allRequests = await getRoomRequests(adminEmail);
    return allRequests.filter(req => req.facultyEmail === facultyEmail);
}

export async function getApprovedRequests(adminEmail: string): Promise<RoomRequest[]> {
    if (!adminEmail) return [];
    const allRequests = await readRequestsFile(adminEmail);
    return allRequests.filter(req => req.status === 'approved');
}

export async function createRoomRequest(adminEmail: string, requestData: RoomRequestData): Promise<{ success: boolean; message: string }> {
    const requests = await readRequestsFile(adminEmail);
    const newRequest: RoomRequest = {
        ...requestData,
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        status: 'pending',
        requestedAt: new Date().toISOString(),
    };
    requests.push(newRequest);
    try {
        await writeRequestsFile(adminEmail, requests);
        return { success: true, message: 'Room request submitted successfully.' };
    } catch (error) {
        console.error('Failed to create room request:', error);
        return { success: false, message: 'An internal error occurred.' };
    }
}

export async function updateRequestStatus(adminEmail: string, requestId: string, status: 'approved' | 'rejected'): Promise<{ success: boolean; message: string }> {
    const requests = await readRequestsFile(adminEmail);
    const requestIndex = requests.findIndex(r => r.id === requestId);
    if (requestIndex === -1) {
        return { success: false, message: 'Request not found.' };
    }
    requests[requestIndex].status = status;
    try {
        await writeRequestsFile(adminEmail, requests);
        return { success: true, message: `Request has been ${status}.` };
    } catch (error) {
        console.error('Failed to update request status:', error);
        return { success: false, message: 'An internal error occurred.' };
    }
}

export async function releaseRoom(adminEmail: string, requestData: RoomRequestData): Promise<{ success: boolean; message: string }> {
    const requests = await readRequestsFile(adminEmail);
    const newRequest: RoomRequest = {
        ...requestData,
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        status: 'approved',
        requestedAt: new Date().toISOString(),
    };
    requests.push(newRequest);
    try {
        await writeRequestsFile(adminEmail, requests);
        return { success: true, message: 'Room released successfully.' };
    } catch (error) {
        console.error('Failed to release room:', error);
        return { success: false, message: 'An internal error occurred.' };
    }
}
