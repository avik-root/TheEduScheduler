'use server';

import fs from 'fs/promises';
import path from 'path';
import type { z } from 'zod';
import { BuildingSchema, RoomSchema, FloorSchema } from '@/lib/validators/auth';
import { getAdminDataPath } from './common';

export interface Room {
    id: string;
    name: string;
    capacity: number;
}

export interface Floor {
    id: string;
    name: string;
    rooms: Room[];
}

export interface Building {
    id: string;
    name: string;
    floors: Floor[];
}

type BuildingData = z.infer<typeof BuildingSchema>;
type RoomData = z.infer<typeof RoomSchema>;
type FloorData = z.infer<typeof FloorSchema>;


async function getBuildingsFilePath(adminEmail: string): Promise<string> {
    const adminDataPath = await getAdminDataPath(adminEmail);
    await fs.mkdir(adminDataPath, { recursive: true });
    return path.join(adminDataPath, 'buildings.json');
}

async function readBuildingsFile(adminEmail: string): Promise<Building[]> {
    try {
        const filePath = await getBuildingsFilePath(adminEmail);
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

async function writeBuildingsFile(adminEmail: string, buildings: Building[]): Promise<void> {
    const filePath = await getBuildingsFilePath(adminEmail);
    await fs.writeFile(filePath, JSON.stringify(buildings, null, 2));
}

export async function getBuildings(adminEmail: string): Promise<Building[]> {
    if (!adminEmail) return [];
    return await readBuildingsFile(adminEmail);
}

export async function getBuildingById(adminEmail: string, id: string): Promise<Building | null> {
    if (!adminEmail) return null;
    const buildings = await readBuildingsFile(adminEmail);
    return buildings.find(b => b.id === id) || null;
}

export async function createBuilding(adminEmail: string, data: BuildingData): Promise<{ success: boolean; message: string }> {
    const buildings = await readBuildingsFile(adminEmail);
    const newBuilding: Building = {
        id: Date.now().toString(),
        name: data.name,
        floors: [],
    };
    buildings.push(newBuilding);
    try {
        await writeBuildingsFile(adminEmail, buildings);
        return { success: true, message: 'Building created successfully.' };
    } catch (error) {
        console.error('Failed to create building:', error);
        return { success: false, message: 'An internal error occurred.' };
    }
}

export async function updateBuilding(adminEmail: string, id: string, data: BuildingData): Promise<{ success: boolean; message: string }> {
    const buildings = await readBuildingsFile(adminEmail);
    const buildingIndex = buildings.findIndex(b => b.id === id);
    if (buildingIndex === -1) {
        return { success: false, message: 'Building not found.' };
    }
    buildings[buildingIndex].name = data.name;
    try {
        await writeBuildingsFile(adminEmail, buildings);
        return { success: true, message: 'Building updated successfully.' };
    } catch (error) {
        console.error('Failed to update building:', error);
        return { success: false, message: 'An internal error occurred.' };
    }
}

export async function deleteBuilding(adminEmail: string, id: string): Promise<{ success: boolean; message: string }> {
    const buildings = await readBuildingsFile(adminEmail);
    const updatedBuildings = buildings.filter(b => b.id !== id);
    if (buildings.length === updatedBuildings.length) {
        return { success: false, message: 'Building not found.' };
    }
    try {
        await writeBuildingsFile(adminEmail, updatedBuildings);
        return { success: true, message: 'Building deleted successfully.' };
    } catch (error) {
        console.error('Failed to delete building:', error);
        return { success: false, message: 'An internal error occurred.' };
    }
}

export async function addFloors(adminEmail: string, buildingId: string, names: string[]): Promise<{ success: boolean; message: string }> {
    const buildings = await readBuildingsFile(adminEmail);
    const buildingIndex = buildings.findIndex(b => b.id === buildingId);
    if (buildingIndex === -1) {
        return { success: false, message: 'Building not found.' };
    }

    names.forEach(name => {
        const newFloor: Floor = {
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            name: name,
            rooms: [],
        };
        buildings[buildingIndex].floors.push(newFloor);
    });
    
    try {
        await writeBuildingsFile(adminEmail, buildings);
        const plural = names.length > 1 ? 's' : '';
        return { success: true, message: `${names.length} floor${plural} added successfully.` };
    } catch (error) {
        console.error('Failed to add floors:', error);
        return { success: false, message: 'An internal error occurred.' };
    }
}

export async function updateFloor(adminEmail: string, buildingId: string, floorId: string, data: FloorData): Promise<{ success: boolean; message: string }> {
    const buildings = await readBuildingsFile(adminEmail);
    const buildingIndex = buildings.findIndex(b => b.id === buildingId);
    if (buildingIndex === -1) {
        return { success: false, message: 'Building not found.' };
    }
    const floorIndex = buildings[buildingIndex].floors.findIndex(f => f.id === floorId);
    if (floorIndex === -1) {
        return { success: false, message: 'Floor not found.' };
    }
    buildings[buildingIndex].floors[floorIndex].name = data.name;
    try {
        await writeBuildingsFile(adminEmail, buildings);
        return { success: true, message: 'Floor updated successfully.' };
    } catch (error) {
        console.error('Failed to update floor:', error);
        return { success: false, message: 'An internal error occurred.' };
    }
}

export async function deleteFloor(adminEmail: string, buildingId: string, floorId: string): Promise<{ success: boolean; message: string }> {
    const buildings = await readBuildingsFile(adminEmail);
    const buildingIndex = buildings.findIndex(b => b.id === buildingId);
    if (buildingIndex === -1) {
        return { success: false, message: 'Building not found.' };
    }
    const originalFloorCount = buildings[buildingIndex].floors.length;
    buildings[buildingIndex].floors = buildings[buildingIndex].floors.filter(f => f.id !== floorId);
    if (buildings[buildingIndex].floors.length === originalFloorCount) {
        return { success: false, message: 'Floor not found.' };
    }
    try {
        await writeBuildingsFile(adminEmail, buildings);
        return { success: true, message: 'Floor deleted successfully.' };
    } catch (error) {
        console.error('Failed to delete floor:', error);
        return { success: false, message: 'An internal error occurred.' };
    }
}

export async function addRooms(adminEmail: string, buildingId: string, floorId: string, rooms: RoomData[]): Promise<{ success: boolean; message: string }> {
    const buildings = await readBuildingsFile(adminEmail);
    const buildingIndex = buildings.findIndex(b => b.id === buildingId);
    if (buildingIndex === -1) {
        return { success: false, message: 'Building not found.' };
    }
    const floorIndex = buildings[buildingIndex].floors.findIndex(f => f.id === floorId);
    if (floorIndex === -1) {
        return { success: false, message: 'Floor not found.' };
    }

    rooms.forEach(roomData => {
         const newRoom: Room = {
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            ...roomData,
        };
        buildings[buildingIndex].floors[floorIndex].rooms.push(newRoom);
    });

    try {
        await writeBuildingsFile(adminEmail, buildings);
        const plural = rooms.length > 1 ? 's' : '';
        return { success: true, message: `${rooms.length} room${plural} added successfully.` };
    } catch (error) {
        console.error('Failed to add rooms:', error);
        return { success: false, message: 'An internal error occurred.' };
    }
}

export async function updateRoom(adminEmail: string, buildingId: string, floorId: string, roomId: string, data: RoomData): Promise<{ success: boolean; message: string }> {
    const buildings = await readBuildingsFile(adminEmail);
    const buildingIndex = buildings.findIndex(b => b.id === buildingId);
    if (buildingIndex === -1) {
        return { success: false, message: 'Building not found.' };
    }
    const floorIndex = buildings[buildingIndex].floors.findIndex(f => f.id === floorId);
    if (floorIndex === -1) {
        return { success: false, message: 'Floor not found.' };
    }
    const roomIndex = buildings[buildingIndex].floors[floorIndex].rooms.findIndex(r => r.id === roomId);
    if (roomIndex === -1) {
        return { success: false, message: 'Room not found.' };
    }
    buildings[buildingIndex].floors[floorIndex].rooms[roomIndex] = { ...buildings[buildingIndex].floors[floorIndex].rooms[roomIndex], ...data };
    try {
        await writeBuildingsFile(adminEmail, buildings);
        return { success: true, message: 'Room updated successfully.' };
    } catch (error) {
        console.error('Failed to update room:', error);
        return { success: false, message: 'An internal error occurred.' };
    }
}

export async function deleteRoom(adminEmail: string, buildingId: string, floorId: string, roomId: string): Promise<{ success: boolean; message: string }> {
    const buildings = await readBuildingsFile(adminEmail);
    const buildingIndex = buildings.findIndex(b => b.id === buildingId);
    if (buildingIndex === -1) {
        return { success: false, message: 'Building not found.' };
    }
    const floorIndex = buildings[buildingIndex].floors.findIndex(f => f.id === floorId);
    if (floorIndex === -1) {
        return { success: false, message: 'Floor not found.' };
    }
    const originalRoomCount = buildings[buildingIndex].floors[floorIndex].rooms.length;
    buildings[buildingIndex].floors[floorIndex].rooms = buildings[buildingIndex].floors[floorIndex].rooms.filter(r => r.id !== roomId);
    if (buildings[buildingIndex].floors[floorIndex].rooms.length === originalRoomCount) {
        return { success: false, message: 'Room not found.' };
    }
    try {
        await writeBuildingsFile(adminEmail, buildings);
        return { success: true, message: 'Room deleted successfully.' };
    } catch (error) {
        console.error('Failed to delete room:', error);
        return { success: false, message: 'An internal error occurred.' };
    }
}

export async function deleteRooms(adminEmail: string, buildingId: string, floorId: string, roomIds: string[]): Promise<{ success: boolean; message: string }> {
    const buildings = await readBuildingsFile(adminEmail);
    const buildingIndex = buildings.findIndex(b => b.id === buildingId);
    if (buildingIndex === -1) {
        return { success: false, message: 'Building not found.' };
    }
    const floorIndex = buildings[buildingIndex].floors.findIndex(f => f.id === floorId);
    if (floorIndex === -1) {
        return { success: false, message: 'Floor not found.' };
    }

    const originalRoomCount = buildings[buildingIndex].floors[floorIndex].rooms.length;
    buildings[buildingIndex].floors[floorIndex].rooms = buildings[buildingIndex].floors[floorIndex].rooms.filter(r => !roomIds.includes(r.id));
    
    const deletedCount = originalRoomCount - buildings[buildingIndex].floors[floorIndex].rooms.length;

    if (deletedCount === 0) {
        return { success: false, message: 'No matching rooms found to delete.' };
    }
    
    try {
        await writeBuildingsFile(adminEmail, buildings);
        const plural = deletedCount > 1 ? 's' : '';
        return { success: true, message: `${deletedCount} room${plural} deleted successfully.` };
    } catch (error) {
        console.error('Failed to delete rooms:', error);
        return { success: false, message: 'An internal error occurred.' };
    }
}
