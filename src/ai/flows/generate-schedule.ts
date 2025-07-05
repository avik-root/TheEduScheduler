
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

const SubjectInfoSchema = z.object({
  name: z.string(),
  code: z.string(),
  type: z.string(),
  credits: z.number().describe("The total credit hours for the subject (Theory + Lab)."),
});

const FacultyInfoSchema = z.object({
    name: z.string(),
    abbreviation: z.string(),
    assignedSubjects: z.array(z.string().describe("List of subject codes assigned to this faculty.")),
    weeklyMaxHours: z.number(),
    weeklyOffDays: z.array(z.string()),
});

const GenerateScheduleInputSchema = z.object({
  yearInfo: z.string().describe('The department, program, and year for which to generate the schedule (e.g., "CSE - B.Tech - Year 1").'),
  timeConstraints: z.string().describe('The daily class start and end times, and break times.'),
  availableRooms: z.array(z.string()).describe('List of available room names.'),
  subjects: z.array(SubjectInfoSchema).describe('List of subjects to be scheduled.'),
  faculty: z.array(FacultyInfoSchema).describe('List of available faculty and their constraints.'),
});
export type GenerateScheduleInput = z.infer<typeof GenerateScheduleInputSchema>;

const GenerateScheduleOutputSchema = z.object({
  schedule: z.string().describe('The generated schedule as a well-formatted string, in Markdown table format.'),
});
export type GenerateScheduleOutput = z.infer<typeof GenerateScheduleOutputSchema>;

export async function generateSchedule(input: GenerateScheduleInput): Promise<GenerateScheduleOutput> {
  return generateScheduleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSchedulePrompt',
  input: {schema: GenerateScheduleInputSchema},
  output: {schema: GenerateScheduleOutputSchema},
  prompt: `You are an AI assistant that creates a weekly class schedule for a specific academic year.

Your goal is to generate an optimal, conflict-free schedule based on the provided constraints.

**Target Group:**
- Year: {{{yearInfo}}}

**Global Constraints:**
- Timings: {{{timeConstraints}}}
- Available Rooms: {{#each availableRooms}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

**Subjects to Schedule:**
{{#each subjects}}
- **{{name}} ({{code}})**: Type: {{type}}, Credits: {{credits}} hours/week.
{{/each}}

**Faculty Information & Constraints:**
{{#each faculty}}
- **{{name}} ({{abbreviation}})**:
  - Max Hours/Week: {{weeklyMaxHours}}
  - Assigned Subjects: {{#each assignedSubjects}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  - Off Days: {{#if weeklyOffDays}}{{#each weeklyOffDays}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}
{{/each}}

**Scheduling Rules & Instructions:**
1.  **Format**: Present the final schedule in a clear Markdown table. The columns should be Time, Monday, Tuesday, Wednesday, Thursday, Friday.
2.  **Time Slots**: Adhere strictly to the provided class timings and break time.
3.  **Credit Hours**: Ensure the total scheduled hours per week for each subject matches its credit value. For a subject with 'Theory+Lab' type, credits represent the combined total.
4.  **Faculty Assignment**: Assign classes only to the faculty member designated for that subject.
5.  **Faculty Constraints**: Do not schedule a faculty member beyond their 'weeklyMaxHours' or on their 'weeklyOffDays'.
6.  **Room Allocation**: Assign each class to one of the 'Available Rooms'.
    - For 'Lab' or 'Theory+Lab' subjects, prioritize rooms with "Lab" in their name if available.
    - Do not schedule more than one class in the same room at the same time.
7.  **No Conflicts**: A faculty member or a student group (year/section) cannot be in two places at once.
8.  **Output Format**: For each table cell, specify the Subject Code, Faculty Abbreviation, and Room Name. Example: "CS101 (ANM) in A_Room 101".

Generate the schedule now.
`,
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
