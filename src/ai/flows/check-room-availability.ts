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
import { getApprovedRequests } from '@/lib/requests';

const CheckRoomAvailabilityInputSchema = z.object({
  roomsToCheck: z
    .array(z.string())
    .min(1, 'At least one room must be selected.')
    .describe('The names of the specific rooms to check for availability.'),
  isCheckingAll: z.boolean().optional().describe('If true, it implies the user is searching for any available room from a large list.'),
  startTime: z.string().describe('The start of the time range to check (e.g., "10:30").'),
  endTime: z.string().describe('The end of the time range to check (e.g., "11:00").'),
  date: z.string().optional().describe('The specific date to check (e.g., "2024-07-26").'),
  days: z.array(z.string()).optional().describe('The days of the week to check.'),
  schedule: z.string().describe('The current schedule, possibly in Markdown format, to check against for conflicts.'),
  adminEmail: z.string().email().describe('The email of the admin account for context.'),
});
export type CheckRoomAvailabilityInput = z.infer<typeof CheckRoomAvailabilityInputSchema>;

const RoomStatusSchema = z.object({
  name: z.string().describe('The name of the room.'),
  status: z.enum(['Available', 'Unavailable', 'Partially Available']).describe('The availability status of the room.'),
  reason: z.string().optional().describe(
    'Detailed information about the status. If unavailable, specify the class, section, year, and time (e.g., "Booked for Physics 101 (Year 1, Section A) from 10:00-11:00"). If available, specify until when (e.g., "Available until 2:00 PM").'
  ),
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

{{#if isCheckingAll}}
IMPORTANT: The user wants to find *any* available room. Your response in the 'availability' array should ONLY include rooms that are 'Available'. Do not include 'Unavailable' or 'Partially Available' rooms in the list.
{{else}}
Your task is to analyze the schedule and determine for each of the requested rooms whether it is 'Available', 'Unavailable', or 'Partially Available' during the specified time slot on the given days/date.
{{/if}}

- **If 'Available'**: The room is not booked during the specified time. In the 'reason' field, analyze the rest of the day's schedule for that room and state until what time it remains free. For example: "Available until 3:00 PM". If it's free for the rest of the working day, state "Available for the rest of the day".

- **If 'Unavailable'**: The room is fully booked during the specified time. In the 'reason' field, provide the full details of the conflict from the schedule. For a regular class, this includes the Class name, Section, Year, and the exact booking time (e.g., "Booked for Physics 101 (Year 2, Section A) from 10:00-11:00"). For an ad-hoc booking, specify the faculty member and the time (e.g., "Booked by Dr. Alan Grant from 10:00-10:50").

- **If 'Partially Available'**: The room is booked for some, but not all, of the specified time or days. Provide details in the reason, explaining the conflict.

{{#unless isCheckingAll}}
Rooms to check: {{#each roomsToCheck}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
{{/unless}}

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
IMPORTANT: You must consider both the main schedule table and any "Additional Approved Bookings" section when checking for conflicts. The ad-hoc requests are also firm bookings.

Based on your analysis, provide the status for each room and a final summary.
{{#if isCheckingAll}}
The summary should state how many rooms are available in total. For example: "Found 5 available rooms."
{{else}}
The summary should be a concise overview. For example: "3 of 5 rooms are fully available."
{{/if}}`,
});

const checkRoomAvailabilityFlow = ai.defineFlow(
  {
    name: 'checkRoomAvailabilityFlow',
    inputSchema: CheckRoomAvailabilityInputSchema,
    outputSchema: CheckRoomAvailabilityOutputSchema,
  },
  async input => {
    const approvedRequests = await getApprovedRequests(input.adminEmail);
    let augmentedSchedule = input.schedule;

    const hasMainSchedule = input.schedule && input.schedule.trim() !== '' && !input.schedule.includes("Your generated schedule will appear here...");

    if (!hasMainSchedule && approvedRequests.length === 0) {
      return {
        availability: input.roomsToCheck.map(roomName => ({
            name: roomName,
            status: 'Available',
            reason: 'No schedule or approved bookings found to check against.'
        })),
        summary: `${input.roomsToCheck.length} rooms are available as no schedule has been generated and no ad-hoc bookings exist.`
      };
    }

    if (approvedRequests.length > 0) {
        const requestsInfo = approvedRequests.map(req => 
            `- Room: ${req.roomName}, Date: ${req.date}, Time: ${req.startTime}-${req.endTime}, Booked by: ${req.facultyName} for: ${req.reason}`
        ).join('\n');
        
        augmentedSchedule = hasMainSchedule
            ? augmentedSchedule + `\n\n--- Additional Approved Bookings ---\n${requestsInfo}`
            : `--- Additional Approved Bookings ---\n${requestsInfo}`;
    }

    const finalInput = { ...input, schedule: augmentedSchedule };
    const {output} = await prompt(finalInput);
    return output!;
  }
);
