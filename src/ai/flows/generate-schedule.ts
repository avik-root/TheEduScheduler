
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

const SectionInfoSchema = z.object({
    name: z.string(),
    studentCount: z.number(),
});

const SubjectConfigSchema = z.object({
    id: z.string(),
    name: z.string(),
    code: z.string(),
    type: z.string(),
    theoryCredits: z.number().optional(),
    labCredits: z.number().optional(),
    assignedFaculty: z.array(z.string()).describe("List of faculty abbreviations assigned to teach this subject."),
    isPriority: z.boolean().describe("Whether this is a priority subject."),
    sections: z.array(z.string()).describe("List of section names this subject applies to."),
});

const FacultyInfoSchema = z.object({
    name: z.string(),
    abbreviation: z.string(),
    weeklyMaxHours: z.number(),
    weeklyOffDays: z.array(z.string()),
});

const GenerateScheduleInputSchema = z.object({
    academicInfo: z.object({
        department: z.string(),
        program: z.string(),
        year: z.string(),
    }),
    sections: z.array(SectionInfoSchema),
    subjects: z.array(SubjectConfigSchema),
    faculty: z.array(FacultyInfoSchema),
    availableRooms: z.array(z.string()).describe('List of all available general-purpose room names.'),
    availableLabs: z.array(z.string()).describe('List of all available lab room names.'),
    timeSettings: z.object({
        startTime: z.string(),
        endTime: z.string(),
        breakTime: z.string().describe('The time slot for the daily break (e.g., "13:00 - 14:00").'),
    }),
    activeDays: z.array(z.string()),
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
  prompt: `You are an AI assistant that creates a weekly class schedule for a specific academic year. Your goal is to generate an optimal, conflict-free schedule based on the provided constraints.

**Target Group:**
- Department: {{academicInfo.department}}
- Program: {{academicInfo.program}}
- Year: {{academicInfo.year}}

**Sections & Student Counts:**
{{#each sections}}
- {{name}}: {{studentCount}} students
{{/each}}

**Time & Day Constraints:**
- Daily Timings: From {{timeSettings.startTime}} to {{timeSettings.endTime}}
- Break Slot: {{timeSettings.breakTime}}
- Active Weekdays: {{#each activeDays}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

**Available Resources:**
- Rooms: {{#if availableRooms}}{{#each availableRooms}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}
- Labs: {{#if availableLabs}}{{#each availableLabs}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}

**Faculty Information:**
{{#each faculty}}
- **{{name}} ({{abbreviation}})**: Max {{weeklyMaxHours}} hours/week. Off on {{#if weeklyOffDays}}{{#each weeklyOffDays}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}.
{{/each}}

**Subjects to Schedule:**
{{#each subjects}}
- **{{name}} ({{code}})**:
  - Type: {{type}}
  - Theory Credits: {{#if theoryCredits}}{{theoryCredits}}{{else}}N/A{{/if}}, Lab Credits: {{#if labCredits}}{{labCredits}}{{else}}N/A{{/if}}
  - Taught by: {{#if assignedFaculty}}{{#each assignedFaculty}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}NF{{/if}}
  - Priority: {{#if isPriority}}Yes{{else}}No{{/if}}
  - For Sections: {{#each sections}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
{{/each}}

**Core Scheduling Rules & Instructions:**
1.  **Format**: Present the final schedule in a clear Markdown table. The columns should be Time, {{#each activeDays}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.
2.  **Time Slots**: Adhere strictly to the provided daily timings and break slot. Classes should be 50 minutes long unless specified otherwise. Do not schedule anything during the break.
3.  **Credit Hours**:
    - Each credit point equals one 50-minute class per week. E.g., 3 credits = three 50-minute classes.
    - **Priority Subjects**: For subjects marked as priority with theory credits, schedule one of their weekly classes as a combined 50+50 minute (100-minute) block. The other classes for that subject should be single 50-minute slots.
    - **Different Days**: Schedule classes for the same subject on different days of the week.
4.  **Lab Scheduling**:
    - All 'Lab' or 'Theory+Lab' subjects **MUST** be scheduled as a combined 50+50 minute block (100 minutes total).
    - **Student Splitting**: If a section's 'studentCount' is over 30, it must be split into 'Group A' and 'Group B' for labs.
    - **Lab Allocation**: For a split section, you must schedule **two separate 100-minute lab blocks** for that subject during the week, one for each group (e.g., "Computer Networks Lab (Sec A, Gp A)", "Computer Networks Lab (Sec A, Gp B)"). Schedule these on different days if possible.
    - Allocate labs only to rooms listed in 'Available Labs'.
5.  **Room & Faculty Allocation**:
    - Assign each class to an available room or lab. A room cannot host two different sections at the same time.
    - A faculty member cannot teach two different classes at the same time.
    - Do not schedule faculty on their 'weeklyOffDays'.
    - Ensure total teaching hours do not exceed a faculty's 'weeklyMaxHours'.
    - Any of the 'assignedFaculty' can teach a subject. If none are assigned (NF), leave the faculty slot blank, formatted as "(NF)".
6.  **Conflict Resolution**: There should be no scheduling conflicts for any section, faculty member, or room. A section cannot attend two classes simultaneously.
7.  **Output Format**: For each table cell, specify the **Subject Name**, **(Faculty Abbreviation)**, and **in Room/Lab Name**. For split labs, include the group (Gp A/Gp B). Example: "Computer Networks (ANM) in A_Lab 202 (Gp A)". For no-faculty subjects: "Physics I (NF) in B_Room_101".

Generate the complete, optimized weekly schedule now.
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
