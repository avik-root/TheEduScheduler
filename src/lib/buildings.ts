'use server';

import fs from 'fs/promises';
import path from 'path';
import type { z } from 'zod';
import { BuildingSchema, RoomSchema } from '@/lib/validators/auth';

const buildingsFilePath = path.join(process.cwd(), 'src', 'data', 'buildings.json');

export interface Room {
    id: string;
    name: string;
    capacity: number;
}

export interface Building {
    id: string;
    name: string;
    rooms: Room[];
}

type BuildingData = z.infer<typeof BuildingSchema>;
type RoomData = z.infer<typeof RoomSchema>;

async function readBuildingsFile(): Promise<Building[]> {
    try {
        await fs.access(buildingsFilePath);
        const fileContent = await fs.readFile(buildingsFilePath, 'utf-8');
        if (!fileContent.trim()) {
            return [];
        }
        return JSON.parse(fileContent);
    } catch (error) {
        return [];
    }
}

async function writeBuildingsFile(buildings: Building[]): Promise<void> {
    await fs.mkdir(path.dirname(buildingsFilePath), { recursive: true });
    await fs.writeFile(buildingsFilePath, JSON.stringify(buildings, null, 2));
}

export async function getBuildings(): Promise<Building[]> {
    return await readBuildingsFile();
}

export async function createBuilding(data: BuildingData): Promise<{ success: boolean; message: string }> {
    const buildings = await readBuildingsFile();
    const newBuilding: Building = {
        id: Date.now().toString(),
        name: data.name,
        rooms: [],
    };
    buildings.push(newBuilding);
    try {
        await writeBuildingsFile(buildings);
        return { success: true, message: 'Building created successfully.' };
    } catch (error) {
        console.error('Failed to create building:', error);
        return { success: false, message: 'An internal error occurred.' };
    }
}

export async function updateBuilding(id: string, data: BuildingData): Promise<{ success: boolean; message: string }> {
    const buildings = await readBuildingsFile();
    const buildingIndex = buildings.findIndex(b => b.id === id);
    if (buildingIndex === -1) {
        return { success: false, message: 'Building not found.' };
    }
    buildings[buildingIndex].name = data.name;
    try {
        await writeBuildingsFile(buildings);
        return { success: true, message: 'Building updated successfully.' };
    } catch (error) {
        console.error('Failed to update building:', error);
        return { success: false, message: 'An internal error occurred.' };
    }
}

export async function deleteBuilding(id: string): Promise<{ success: boolean; message: string }> {
    const buildings = await readBuildingsFile();
    const updatedBuildings = buildings.filter(b => b.id !== id);
    if (buildings.length === updatedBuildings.length) {
        return { success: false, message: 'Building not found.' };
    }
    try {
        await writeBuildingsFile(updatedBuildings);
        return { success: true, message: 'Building deleted successfully.' };
    } catch (error) {
        console.error('Failed to delete building:', error);
        return { success: false, message: 'An internal error occurred.' };
    }
}

export async function addRoom(buildingId: string, data: RoomData): Promise<{ success: boolean; message: string }> {
    const buildings = await readBuildingsFile();
    const buildingIndex = buildings.findIndex(b => b.id === buildingId);
    if (buildingIndex === -1) {
        return { success: false, message: 'Building not found.' };
    }
    const newRoom: Room = {
        id: Date.now().toString(),
        ...data,
    };
    buildings[buildingIndex].rooms.push(newRoom);
    try {
        await writeBuildingsFile(buildings);
        return { success: true, message: 'Room added successfully.' };
    } catch (error) {
        console.error('Failed to add room:', error);
        return { success: false, message: 'An internal error occurred.' };
    }
}

export async function updateRoom(buildingId: string, roomId: string, data: RoomData): Promise<{ success: boolean; message: string }> {
    const buildings = await readBuildingsFile();
    const buildingIndex = buildings.findIndex(b => b.id === buildingId);
    if (buildingIndex === -1) {
        return { success: false, message: 'Building not found.' };
    }
    const roomIndex = buildings[buildingIndex].rooms.findIndex(r => r.id === roomId);
    if (roomIndex === -1) {
        return { success: false, message: 'Room not found.' };
    }
    buildings[buildingIndex].rooms[roomIndex] = { ...buildings[buildingIndex].rooms[roomIndex], ...data };
    try {
        await writeBuildingsFile(buildings);
        return { success: true, message: 'Room updated successfully.' };
    } catch (error) {
        console.error('Failed to update room:', error);
        return { success: false, message: 'An internal error occurred.' };
    }
}

export async function deleteRoom(buildingId: string, roomId: string): Promise<{ success: boolean; message: string }> {
    const buildings = await readBuildingsFile();
    const buildingIndex = buildings.findIndex(b => b.id === buildingId);
    if (buildingIndex === -1) {
        return { success: false, message: 'Building not found.' };
    }
    const originalRoomCount = buildings[buildingIndex].rooms.length;
    buildings[buildingIndex].rooms = buildings[buildingIndex].rooms.filter(r => r.id !== roomId);
    if (buildings[buildingIndex].rooms.length === originalRoomCount) {
        return { success: false, message: 'Room not found.' };
    }
    try {
        await writeBuildingsFile(buildings);
        return { success: true, message: 'Room deleted successfully.' };
    } catch (error) {
        console.error('Failed to delete room:', error);
        return { success: false, message: 'An internal error occurred.' };
    }
}
