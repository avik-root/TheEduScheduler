'use server';

import { config } from 'dotenv';
config();

import '@/ai/flows/generate-schedule.ts';
import '@/ai/flows/suggest-schedule-improvements.ts';
import '@/ai/flows/check-room-availability.ts';
import '@/ai/flows/check-schedule-conflict.ts';
