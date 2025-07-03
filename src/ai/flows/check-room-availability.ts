'use server';

/**
 * @fileOverview An AI agent for checking room availability.
 *
 * - checkRoomAvailability - A function that handles the room availability check process.
 * - CheckRoomAvailabilityInput - The input type for the checkRoomAvailability function.
 * - CheckRoomAvailabilityOutput - The return type for the checkRoomAvailability function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CheckRoomAvailabilityInputSchema = z.object({
  roomsToCheck: z
    .array(z.string())
    .min(1, 'At least one room must be selected.')
    .describe('The names of the specific rooms to check for availability.'),
  startTime: z.string().describe('The start of the time range to check (e.g., "10:30").'),
  endTime: z.string().describe('The end of the time range to check (e.g., "11:00").'),
  date: z.string().optional().describe('The specific date to check (e.g., "2024-07-26").'),
  days: z.array(z.string()).optional().describe('The days of the week to check.'),
  schedule: z.string().describe('The current schedule, possibly in Markdown format, to check against for conflicts.'),
});
export type CheckRoomAvailabilityInput = z.infer<typeof CheckRoomAvailabilityInputSchema>;

const RoomStatusSchema = z.object({
  name: z.string().describe('The name of the room.'),
  status: z.enum(['Available', 'Unavailable', 'Partially Available']).describe('The availability status of the room.'),
  reason: z.string().optional().describe('Reason for unavailability or partial availability (e.g., "Booked for Physics 101 from 10:00-11:00").'),
});

const CheckRoomAvailabilityOutputSchema = z.object({
  availability: z
    .array(RoomStatusSchema)
    .describe('A list of the checked rooms with their availability status.'),
  summary: z.string().describe('A concise summary of the availability check (e.g., "3 of 5 rooms are fully available.").'),
});
export type CheckRoomAvailabilityOutput = z.infer<typeof CheckRoomAvailabilityOutputSchema>;

export async function checkRoomAvailability(input: CheckRoomAvailabilityInput): Promise<CheckRoomAvailabilityOutput> {
  return checkRoomAvailabilityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'checkRoomAvailabilityPrompt',
  input: {schema: CheckRoomAvailabilityInputSchema},
  output: {schema: CheckRoomAvailabilityOutputSchema},
  prompt: `You are an AI assistant that checks room availability based on a provided schedule.

You will be given a list of rooms to check, a time range, and specific days or a specific date. You will also receive the current schedule.

Your task is to analyze the schedule and determine for each of the requested rooms whether it is 'Available', 'Unavailable', or 'Partially Available' during the specified time slot on the given days/date.

- 'Available': The room is not booked at all during the specified time.
- 'Unavailable': The room is fully booked during the specified time. Provide the reason (e.g., what class it's booked for).
- 'Partially Available': The room is booked for some, but not all, of the specified time or days. Provide details in the reason.

Rooms to check: {{#each roomsToCheck}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
Time range: From {{startTime}} to {{endTime}}
{{#if date}}
Date: {{date}}
{{else}}
Days: {{#each days}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}

Current Schedule to analyze:
\`\`\`
{{{schedule}}}
\`\`\`

Based on your analysis, provide the status for each room and a final summary.`,
});

const checkRoomAvailabilityFlow = ai.defineFlow(
  {
    name: 'checkRoomAvailabilityFlow',
    inputSchema: CheckRoomAvailabilityInputSchema,
    outputSchema: CheckRoomAvailabilityOutputSchema,
  },
  async input => {
    // If no schedule is provided, assume all rooms are available.
    if (!input.schedule || input.schedule.trim() === '' || input.schedule.includes("Your generated schedule will appear here...")) {
        return {
            availability: input.roomsToCheck.map(roomName => ({
                name: roomName,
                status: 'Available',
                reason: 'No schedule provided to check against.'
            })),
            summary: `${input.roomsToCheck.length} rooms are available as no schedule has been generated yet.`
        };
    }
    const {output} = await prompt(input);
    return output!;
  }
);
