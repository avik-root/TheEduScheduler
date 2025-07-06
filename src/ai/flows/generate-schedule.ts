'use server';

/**
 * @fileOverview An AI schedule generator for admins.
 *
 * - generateSchedule - A function that handles the schedule generation process.
 * - GenerateScheduleInput - The input type for the generateSchedule function.
 * - GenerateScheduleOutput - The return type for the generateScheduleOutput function.
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
  schedule: z.string().describe('The generated schedule as a well-formatted string, containing multiple Markdown tables, one for each section.'),
});
export type GenerateScheduleOutput = z.infer<typeof GenerateScheduleOutputSchema>;

export async function generateSchedule(input: GenerateScheduleInput): Promise<GenerateScheduleOutput> {
  return generateScheduleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSchedulePrompt',
  input: {schema: GenerateScheduleInputSchema},
  output: {schema: GenerateScheduleOutputSchema},
  prompt: `You are an AI assistant that creates a weekly class schedule for a specific academic year. Your primary goal is to generate an optimal, 100% conflict-free schedule based on the provided constraints.

**--- CORE DIRECTIVE: AVOID ALL CONFLICTS ---**
This is the most important rule. There must be **ZERO** scheduling conflicts.
- **Faculty Conflict**: A faculty member cannot teach two different classes in different rooms at the same time.
- **Room Conflict**: A room or lab cannot be used by two different sections or for two different classes at the same time.
- **Section Conflict**: A section (or a group within a section) cannot attend two different classes at the same time.

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
- Break Slot: {{timeSettings.breakTime}}. Do not schedule anything during this time.
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

**--- DETAILED SCHEDULING RULES ---**
1.  **Credit Hours & Class Duration**:
    - Each credit point equals one 50-minute class per week (e.g., 3 credits = three 50-minute classes).
    - **Combined vs. Single Slots**:
        - 'Lab', 'Theory+Lab', and 'Project' subjects **MUST** be scheduled as a single 100-minute block (two consecutive 50-minute slots). No 50-minute lab classes are allowed.
        - For 'Theory' subjects marked as priority, schedule one of their weekly classes as a 100-minute block. The other classes for that subject should be single 50-minute slots.
        - Spread classes for the same subject across different days of the week where possible.
    - **Daily Combined Class Limit**: A section should have a maximum of **two** 100-minute class blocks on any given day. This limit **does not apply to lab sessions**.

2.  **Lab & Student Grouping**:
    - **Student Splitting for Labs**: If a section's 'studentCount' is over 30, it must be split into 'Group A' and 'Group B' for labs. You must schedule **two separate 100-minute lab blocks** for that subject during the week, one for each group (e.g., "Computer Networks Lab (Sec A, Gp A)", "Computer Networks Lab (Sec A, Gp B)").
    - Allocate labs only to rooms listed in 'Available Labs'.

3.  **Faculty Constraints**:
    - For subjects with 'assignedFaculty', pick one faculty member per class slot from the provided list.
    - Strictly adhere to each faculty's 'weeklyOffDays' and do not exceed their 'weeklyMaxHours'.

4.  **No-Faculty (NF) Subjects**:
    - Subjects with "Taught by: NF" **MUST be scheduled**.
    - In the schedule table, use \`(NF)\` for the faculty abbreviation for these classes.

5.  **Slot Filling**:
    - Your goal is to schedule ALL required classes. Only mark a time slot as 'Free' or '-' if it is impossible to place a class without causing a conflict.

6.  **Room Optimization**: As a secondary goal (after ensuring no conflicts), try to use the **minimum number of unique rooms and labs** possible.

**--- OUTPUT FORMATTING ---**
1.  **Main Heading**: The entire output string MUST start with a level 2 markdown heading containing the Program and Year, formatted exactly like this: \`## {{academicInfo.program}} - {{academicInfo.year}}\`.
2.  **Section Tables**: Generate a **separate Markdown table for each section**. Precede each table with a level 3 heading for the section name (e.g., \`### Section 1\`).
3.  **Table Structure**: The first column of each table must be \`Day\`. The subsequent columns must be the 50-minute time slots (e.g., "09:00-09:50"). The rows will represent each active day of the week.
4.  **Cell Format**: Each class cell must be formatted as: **Subject Name (Faculty Abbreviation) in Room/Lab Name**. For split labs, add the group, e.g., \`(Gp A)\`. For no-faculty subjects: "Physics I (NF) in B_Room_101".

Generate the complete, conflict-free, and optimized weekly schedule now for all specified sections.
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
