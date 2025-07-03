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
    .describe('Specific time constraints for the schedule (e.g., "Lunch break from 1 PM to 2 PM").'),
  availableRooms: z
    .array(z.string())
    .describe('The names of the specific rooms available for scheduling.'),
  roomAvailability: z
    .object({
      startTime: z.string().describe('The start time for room availability (e.g., "09:00").'),
      endTime: z.string().describe('The end time for room availability (e.g., "17:00").'),
      days: z.array(z.string()).describe('The days of the week when rooms are available (e.g., ["Monday", "Friday"]).'),
    })
    .describe('The specific times and days the rooms are available.'),
  theoryPriorities: z
    .string()
    .describe('Priorities for theory-based courses.'),
  labPriorities: z
    .string()
    .describe('Priorities for lab-based or practical courses, which may require specific room types.'),
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

You will generate a detailed schedule based on the provided constraints. Differentiate between theory classes and practical/lab sessions, considering they might have different requirements.

Global Time Constraints: {{{timeConstraints}}}

Resource Availability:
- Available Rooms: {{#if availableRooms}}{{#each availableRooms}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}No rooms specified.{{/if}}
- Room Availability Times: From {{roomAvailability.startTime}} to {{roomAvailability.endTime}} on {{#each roomAvailability.days}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.

Task and Course Priorities:
- Theory Classes: {{{theoryPriorities}}}
- Lab/Practical Sessions: {{{labPriorities}}}

Generate a detailed schedule based on this information. Present the schedule clearly, for example using a Markdown table. Ensure lab sessions are scheduled within the available times and consider that they might require specific types of rooms if mentioned in the priorities.

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
