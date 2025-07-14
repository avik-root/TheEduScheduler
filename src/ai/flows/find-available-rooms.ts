'use server';

/**
 * @fileOverview An AI agent for finding available rooms across all schedules.
 *
 * - findAvailableRooms - A function that handles finding all available rooms during a specific time.
 * - FindAvailableRoomsInput - The input type for the findAvailableRooms function.
 * - FindAvailableRoomsOutput - The return type for the findAvailableRooms function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FindAvailableRoomsInputSchema = z.object({
  startTime: z.string().describe('The start of the time range to check (e.g., "09:00").'),
  endTime: z.string().describe('The end of the time range to check (e.g., "17:00").'),
  activeDays: z.array(z.string()).describe('The days of the week to check (e.g., ["Monday", "Tuesday"]).'),
  allRooms: z.array(z.string()).describe('A list of all possible room and lab names in the institution.'),
  publishedSchedule: z.string().describe('The complete published schedule for all departments and years, in Markdown format, to check against for conflicts.'),
});
export type FindAvailableRoomsInput = z.infer<typeof FindAvailableRoomsInputSchema>;


const FindAvailableRoomsOutputSchema = z.object({
  availableRooms: z.array(z.string()).describe('A list of all general-purpose rooms that are completely free during the specified times on all specified days.'),
  availableLabs: z.array(z.string()).describe('A list of all lab rooms that are completely free during the specified times on all specified days.'),
});
export type FindAvailableRoomsOutput = z.infer<typeof FindAvailableRoomsOutputSchema>;


export async function findAvailableRooms(input: FindAvailableRoomsInput): Promise<FindAvailableRoomsOutput> {
  // If there's no schedule, all rooms are available.
  if (!input.publishedSchedule || input.publishedSchedule.trim() === '') {
    return {
      availableRooms: input.allRooms.filter(r => !r.toLowerCase().includes('lab')),
      availableLabs: input.allRooms.filter(r => r.toLowerCase().includes('lab')),
    };
  }
  return findAvailableRoomsFlow(input);
}


const prompt = ai.definePrompt({
  name: 'findAvailableRoomsPrompt',
  input: {schema: FindAvailableRoomsInputSchema},
  output: {schema: FindAvailableRoomsOutputSchema},
  prompt: `You are an AI assistant that determines which rooms are available based on a master schedule.

Your task is to analyze the provided master schedule and identify which of the "allRooms" are completely free and unbooked during the specified time range (from {{startTime}} to {{endTime}}) for ALL of the specified "activeDays".

A room is only considered available if it has NO classes scheduled within the time range on ANY of the active days.

- From the list of available rooms you identify, separate them into two lists:
  1.  \`availableRooms\`: General purpose classrooms. These typically do not have "LAB" in their name.
  2.  \`availableLabs\`: Specialist lab rooms. These typically have "LAB" in their name.

- Ensure your output contains only rooms from the provided "allRooms" list.

**Context:**
- **Time Range to Check:** {{startTime}} to {{endTime}}
- **Days to Check:** {{#each activeDays}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
- **List of All Possible Rooms:** {{#each allRooms}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

**Master Schedule to Analyze:**
\`\`\`
{{{publishedSchedule}}}
\`\`\`

Based on your analysis, provide the final lists of available rooms and labs.
`,
});

const findAvailableRoomsFlow = ai.defineFlow(
  {
    name: 'findAvailableRoomsFlow',
    inputSchema: FindAvailableRoomsInputSchema,
    outputSchema: FindAvailableRoomsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
