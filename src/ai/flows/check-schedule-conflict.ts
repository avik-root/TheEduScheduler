'use server';

/**
 * @fileOverview An AI agent for checking for schedule conflicts.
 *
 * - checkScheduleConflict - A function that handles checking if a new class conflicts with an existing schedule.
 * - CheckConflictInput - The input type for the checkScheduleConflict function.
 * - CheckConflictOutput - The return type for the checkScheduleConflict function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CheckConflictInputSchema = z.object({
  currentSchedule: z.string().describe("The current schedule in Markdown format. May be empty if it's the first class."),
  newClass: z.object({
    subject: z.string(),
    faculty: z.string(),
    room: z.string(),
    day: z.string(),
    timeSlot: z.string(),
    section: z.string(),
  }),
});
export type CheckConflictInput = z.infer<typeof CheckConflictInputSchema>;

const CheckConflictOutputSchema = z.object({
  isConflict: z.boolean().describe("True if there is a conflict, false otherwise."),
  reason: z.string().optional().describe("A detailed explanation of the conflict if one is found. E.g., 'Faculty Conflict: Dr. Grant is already teaching Physics in Section B at this time.'"),
});
export type CheckConflictOutput = z.infer<typeof CheckConflictOutputSchema>;


export async function checkScheduleConflict(input: CheckConflictInput): Promise<CheckConflictOutput> {
  return checkScheduleConflictFlow(input);
}

const prompt = ai.definePrompt({
  name: 'checkScheduleConflictPrompt',
  input: {schema: CheckConflictInputSchema},
  output: {schema: CheckConflictOutputSchema},
  prompt: `You are a schedule conflict detector. Given a current schedule in Markdown format and a new class to add, determine if there is a conflict.

A conflict exists if:
1.  **Faculty Conflict**: The faculty member ('{{newClass.faculty}}') is already assigned to another class in any section at the same time ('{{newClass.timeSlot}}') on the same day ('{{newClass.day}}'). IMPORTANT: If the faculty is 'NF' (No Faculty), you should skip this check as there is no faculty conflict.
2.  **Room Conflict**: The room ('{{newClass.room}}') is already occupied by another class in any section at the same time ('{{newClass.timeSlot}}') on the same day ('{{newClass.day}}').
3.  **Section Conflict**: The section ('{{newClass.section}}') is already assigned to a class at the same time ('{{newClass.timeSlot}}') on the same day ('{{newClass.day}}').

**Current Schedule:**
\`\`\`markdown
{{{currentSchedule}}}
\`\`\`

**New class to check:**
- Subject: {{newClass.subject}}
- Faculty: {{newClass.faculty}}
- Room: {{newClass.room}}
- Day: {{newClass.day}}
- Time: {{newClass.timeSlot}}
- Section: {{newClass.section}}

Analyze the schedule for conflicts with the new class. If you find a conflict, set 'isConflict' to true and provide a clear, concise reason. If there are no conflicts, set 'isConflict' to false.`,
});

const checkScheduleConflictFlow = ai.defineFlow(
  {
    name: 'checkScheduleConflictFlow',
    inputSchema: CheckConflictInputSchema,
    outputSchema: CheckConflictOutputSchema,
  },
  async input => {
    // If this is the first class being added, there can't be a conflict.
    if (!input.currentSchedule.trim()) {
        return { isConflict: false };
    }
    const {output} = await prompt(input);
    return output!;
  }
);
