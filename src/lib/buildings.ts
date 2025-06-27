'use server';

import fs from 'fs/promises';
import path from 'path';
import type { z } from 'zod';
import { BuildingSchema, RoomSchema, FloorSchema } from '@/lib/validators/auth';

const buildingsFilePath = path.join(process.cwd(), 'src', 'data', 'buildings.json');

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

export async function getBuildingById(id: string): Promise<Building | null> {
    const buildings = await readBuildingsFile();
    return buildings.find(b => b.id === id) || null;
}

export async function createBuilding(data: BuildingData): Promise<{ success: boolean; message: string }> {
    const buildings = await readBuildingsFile();
    const newBuilding: Building = {
        id: Date.now().toString(),
        name: data.name,
        floors: [],
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

export async function addFloors(buildingId: string, names: string[]): Promise<{ success: boolean; message: string }> {
    const buildings = await readBuildingsFile();
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
        await writeBuildingsFile(buildings);
        const plural = names.length > 1 ? 's' : '';
        return { success: true, message: `${names.length} floor${plural} added successfully.` };
    } catch (error) {
        console.error('Failed to add floors:', error);
        return { success: false, message: 'An internal error occurred.' };
    }
}

export async function updateFloor(buildingId: string, floorId: string, data: FloorData): Promise<{ success: boolean; message: string }> {
    const buildings = await readBuildingsFile();
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
        await writeBuildingsFile(buildings);
        return { success: true, message: 'Floor updated successfully.' };
    } catch (error) {
        console.error('Failed to update floor:', error);
        return { success: false, message: 'An internal error occurred.' };
    }
}

export async function deleteFloor(buildingId: string, floorId: string): Promise<{ success: boolean; message: string }> {
    const buildings = await readBuildingsFile();
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
        await writeBuildingsFile(buildings);
        return { success: true, message: 'Floor deleted successfully.' };
    } catch (error) {
        console.error('Failed to delete floor:', error);
        return { success: false, message: 'An internal error occurred.' };
    }
}

export async function addRooms(buildingId: string, floorId: string, rooms: RoomData[]): Promise<{ success: boolean; message: string }> {
    const buildings = await readBuildingsFile();
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
        await writeBuildingsFile(buildings);
        const plural = rooms.length > 1 ? 's' : '';
        return { success: true, message: `${rooms.length} room${plural} added successfully.` };
    } catch (error) {
        console.error('Failed to add rooms:', error);
        return { success: false, message: 'An internal error occurred.' };
    }
}

export async function updateRoom(buildingId: string, floorId: string, roomId: string, data: RoomData): Promise<{ success: boolean; message: string }> {
    const buildings = await readBuildingsFile();
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
        await writeBuildingsFile(buildings);
        return { success: true, message: 'Room updated successfully.' };
    } catch (error) {
        console.error('Failed to update room:', error);
        return { success: false, message: 'An internal error occurred.' };
    }
}

export async function deleteRoom(buildingId: string, floorId: string, roomId: string): Promise<{ success: boolean; message: string }> {
    const buildings = await readBuildingsFile();
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
        await writeBuildingsFile(buildings);
        return { success: true, message: 'Room deleted successfully.' };
    } catch (error) {
        console.error('Failed to delete room:', error);
        return { success: false, message: 'An internal error occurred.' };
    }
}
