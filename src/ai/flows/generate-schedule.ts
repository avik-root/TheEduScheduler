'use server';

/**
 * @fileOverview An AI schedule generator for admins.
 *
 * - generateSchedule - A function that handles the schedule generation process.
 * - GenerateScheduleInput - The input type for the generateSchedule function.
 * - GenerateScheduleOutput - The return type for the generateSchedule function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateScheduleInputSchema = z.object({
  timeConstraints: z
    .string()
    .describe('Specific time constraints for the schedule (e.g., "Classes only between 9 AM and 5 PM, Monday to Friday").'),
  availableRooms: z
    .number()
    .describe('The total number of rooms available for scheduling.'),
  roomAvailabilityTime: z
    .string()
    .describe('The specific times the rooms are available (e.g., "9 AM to 5 PM on weekdays").'),
  taskPriorities: z
    .string()
    .describe('Priorities of tasks or courses to be scheduled (e.g., "Calculus 101 is a high priority course").'),
});
export type GenerateScheduleInput = z.infer<typeof GenerateScheduleInputSchema>;

const GenerateScheduleOutputSchema = z.object({
  schedule: z.string().describe('The generated schedule as a well-formatted string, potentially in Markdown for tables.'),
});
export type GenerateScheduleOutput = z.infer<typeof GenerateScheduleOutputSchema>;

export async function generateSchedule(input: GenerateScheduleInput): Promise<GenerateScheduleOutput> {
  return generateScheduleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSchedulePrompt',
  input: {schema: GenerateScheduleInputSchema},
  output: {schema: GenerateScheduleOutputSchema},
  prompt: `You are an AI scheduling assistant for use by organization admins.

You will generate a detailed schedule based on the provided time constraints, resource availability, and task priorities.

Time Constraints: {{{timeConstraints}}}
Number of Available Rooms: {{{availableRooms}}}
Room Availability Times: {{{roomAvailabilityTime}}}
Task/Course Priorities: {{{taskPriorities}}}

Generate a detailed schedule based on this information. Present the schedule clearly, for example using a Markdown table.

Schedule:`,
});

const generateScheduleFlow = ai.defineFlow(
  {
    name: 'generateScheduleFlow',
    inputSchema: GenerateScheduleInputSchema,
    outputSchema: GenerateScheduleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
