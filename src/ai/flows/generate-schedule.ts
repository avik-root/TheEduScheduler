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
        breakTime: z.string().describe('The time slot for the daily break (e.g., "13:00-14:00").'),
        classDuration: z.number().describe("The duration of a single class period in minutes."),
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
  prompt: `You are an AI assistant that creates a weekly class schedule. Your primary goal is to generate an optimal, 100% conflict-free schedule that adheres to all the following rules.

**--- CRITICAL DIRECTIVES: READ AND FOLLOW ALL ---**
1.  **NO CONFLICTS (Most Important)**: There must be **ZERO** scheduling conflicts. This is your highest priority.
    - **Faculty Conflict**: A faculty member **cannot** be assigned to two different sections at the same time.
    - **Room Conflict**: A room or lab **cannot** be used by two different sections or for two different classes at the same time.
    - **Section Conflict**: A section **cannot** attend two different classes at the same time.

2.  **COMPLETE COVERAGE**: You **MUST** generate a full schedule table for **EVERY SINGLE SECTION** listed in the input. Do not omit any sections from the output.

3.  **NO EMPTY DAYS**: Every section **MUST** have at least one class scheduled on every single 'Active Weekday'. It is not permissible to have a day with no classes for any section. This is a critical requirement.

4.  **BALANCED DISTRIBUTION**: Distribute classes as evenly as possible across each day for each section.
    - **Consecutive Class Limit**: **DO NOT** schedule more than three consecutive theory class slots. A double-length block counts as two consecutive slots.
    - **Spread Subjects**: Classes for the same subject **MUST** be spread across different days. For example, a 4-credit subject scheduled as two double-length blocks **must** have them on separate days. A 3-credit subject scheduled as one double-length block and one single-length slot **must** also have them on separate days.

**--- SCHEDULING CONTEXT ---**
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
- **Class Duration**: Each standard class period is **{{timeSettings.classDuration}} minutes**.

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
1.  **Credit Hours, Duration, & Spreading**:
    - Each credit point equals one **{{timeSettings.classDuration}}-minute** class per week.
    - **Combined vs. Single Slots**:
        - 'Lab', 'Theory+Lab', and 'Project' subjects **MUST** be scheduled as a single double-length block (two consecutive {{timeSettings.classDuration}}-minute slots). No single-slot lab classes are allowed.
        - For 'Theory' subjects, if they have 3 or more credits, schedule one of their weekly classes as a double-length block. The other classes for that subject should be single {{timeSettings.classDuration}}-minute slots.

2.  **Lab & Student Grouping**:
    - **Student Splitting for Labs**: If a section's 'studentCount' is over 30, it must be split into 'Group A' and 'Group B' for labs. You must schedule **two separate double-length lab blocks** for that subject during the week, one for each group (e.g., "Computer Networks Lab (Sec A, Gp A)", "Computer Networks Lab (Sec A, Gp B)").
    - Allocate labs only to rooms listed in 'Available Labs'.

3.  **Faculty Constraints**:
    - For subjects with 'assignedFaculty', pick one faculty member per class slot from the provided list.
    - Strictly adhere to each faculty's 'weeklyOffDays' and do not exceed their 'weeklyMaxHours'.

4.  **No-Faculty (NF) Subjects**:
    - Subjects with "Taught by: NF" **MUST be scheduled**.
    - In the schedule table, use \`(NF)\` for the faculty abbreviation for these classes.

5.  **Slot Filling**: After satisfying all other rules, your goal is to schedule ALL remaining required classes. Only mark a time slot as 'Free' or '-' if it is impossible to place a class without causing a conflict.

6.  **Room Optimization**: As a secondary goal (after ensuring no conflicts), try to use the **minimum number of unique rooms and labs** possible.

**--- OUTPUT FORMATTING ---**
1.  **Main Heading**: The entire output string MUST start with a level 2 markdown heading containing the Program and Year, formatted exactly like this: \`## {{academicInfo.program}} - {{academicInfo.year}}\`.
2.  **Section Tables**: Generate a **separate Markdown table for each section listed in the input**. This is not optional. Precede each table with a level 3 heading for the section name (e.g., \`### Section 1\`).
3.  **Table Structure**: 
    - The first column of each table must be \`Day\`. 
    - The subsequent columns must be the **{{timeSettings.classDuration}}-minute time slots**, calculated based on the daily start/end times. 
    - **IMPORTANT**: You MUST include a column in the header for the main break slot (e.g., a column header "15:00-15:30"). All cells under this break column must contain only the word "Break".
4.  **Cell Format**: Each class cell must be formatted as: **Subject Name (Faculty Abbreviation) in Room/Lab Name**. For split labs, add the group, e.g., \`(Gp A)\`. For no-faculty subjects: "Physics I (NF) in B_Room_101". For empty slots, use '-'.

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
