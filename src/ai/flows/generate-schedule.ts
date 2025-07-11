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
        classDuration: z.number().describe("The duration of a single class period in minutes."),
    }),
    activeDays: z.array(z.string()),
});
export type GenerateScheduleInput = z.infer<typeof GenerateScheduleInputSchema>;

const GenerateScheduleOutputSchema = z.object({
  schedule: z.string().describe('The generated schedule as a well-formatted string, containing multiple Markdown tables, one for each section. If schedule generation fails, this MUST be an empty string.'),
  errorReason: z.string().optional().describe('If you cannot generate a schedule that satisfies all rules, provide a detailed, user-friendly explanation here. For example: "Could not schedule all classes for Section A due to a persistent faculty conflict with Dr. Grant on Tuesday mornings."'),
});
export type GenerateScheduleOutput = z.infer<typeof GenerateScheduleOutputSchema>;

export async function generateSchedule(input: GenerateScheduleInput): Promise<GenerateScheduleOutput> {
  return generateScheduleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSchedulePrompt',
  input: {schema: GenerateScheduleInputSchema},
  output: {schema: GenerateScheduleOutputSchema},
  prompt: `You are an AI assistant that creates a weekly class schedule. Your goal is to generate a conflict-free and optimal schedule based on the provided information and a strict set of rules.

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
- {{name}}: {{studentCount}} students. (Note: If student count > 30, split lab classes into Gp A and Gp B).
{{/each}}

**Time & Day Constraints:**
- Daily Timings: From {{timeSettings.startTime}} to {{timeSettings.endTime}}
- Class Duration: {{timeSettings.classDuration}} minutes per period.
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
  - For Sections: {{#each sections}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
{{/each}}

**--- DETAILED SCHEDULING RULES ---**
1.  **Credit Distribution & Duration**:
    - **Theory**:
        - 2-credit: two 50-min classes/week.
        - 3-credit: one double-period (100 mins) and one single-period (50 mins)/week, on different days.
        - 4-credit: two double-periods on two different days/week.
    - **Lab**: 1-credit labs MUST be a single 100-minute double-period session once per week.
    - **Priority Subjects**: Subjects marked as 'isPriority: true' MUST be scheduled as double-duration sessions (two consecutive periods, e.g., "09:00-10:40").
2.  **Lab & Student Grouping**:
    - **Student Splitting for Labs**: If a section's 'studentCount' is over 30, it must be split into 'Group A' and 'Group B' for labs. You must schedule **two separate double-length lab blocks** for that subject during the week, one for each group (e.g., "Computer Networks Lab (Sec A, Gp A)"). Try to schedule the other group's lab for a different subject at the same time if labs are available.
    - Allocate labs only to rooms listed in 'Available Labs'.
3.  **Faculty Constraints**:
    - For subjects with 'assignedFaculty', pick one faculty member per class slot from the provided list.
    - Strictly adhere to each faculty's 'weeklyOffDays' and do not exceed their 'weeklyMaxHours'.
    - Subjects with "Taught by: NF" **MUST be scheduled**. Use \`(NF)\` for the faculty abbreviation.
4.  **Room Optimization**: As a secondary goal (after ensuring no conflicts), try to use the **minimum number of unique rooms and labs** possible.

**--- OUTPUT FORMATTING ---**
1.  **Main Heading**: The entire output string MUST start with a level 2 markdown heading containing the Program and Year, formatted exactly like this: \`## {{academicInfo.program}} - {{academicInfo.year}}\`.
2.  **Section Tables**: Generate a **separate Markdown table for each section listed in the input**. This is not optional. Precede each table with a level 3 heading for the section name (e.g., \`### Section 1\`).
3.  **Table Structure**: The first column of each table must be \`Day\`. The subsequent columns must be the **{{timeSettings.classDuration}}-minute time slots**. You must calculate these time slots yourself based on the daily start/end times. For example, if start time is "09:00" and duration is 50 minutes, the first time slot column is "09:00-09:50". The rows will represent each active day of the week.
4.  **Cell Format**: Each class cell must be formatted as: **Subject Name (Faculty Abbreviation) in Room/Lab Name**. For split labs, add the group, e.g., \`(Gp A)\`. For no-faculty subjects: "Physics I (NF) in B_Room_101".

**--- ERROR HANDLING ---**
If you are completely unable to generate a valid schedule that satisfies all the core rules, you MUST set the 'schedule' output field to an empty string and provide a clear, user-friendly explanation in the 'errorReason' field. Describe the specific, most critical conflict you encountered (e.g., "Faculty Conflict: Dr. Alan Grant is double-booked on Monday at 10:00 AM for both 'Intro to AI' and 'Advanced Algorithms'.", or "Resource Shortage: Not enough lab rooms available on Tuesday afternoons to accommodate all required lab sessions.").

Generate the schedule now, ensuring every subject receives the correct number of sessions per week and all rules are satisfied.
`,
});

const generateScheduleFlow = ai.defineFlow(
  {
    name: 'generateScheduleFlow',
    inputSchema: GenerateScheduleInputSchema,
    outputSchema: GenerateScheduleOutputSchema,
  },
  async input => {
    try {
        const {output} = await prompt(input);
        return output!;
    } catch (error: any) {
        // Check for specific 503 error from the AI service
        if (error.message && (error.message.includes('503') || error.message.toLowerCase().includes('overloaded'))) {
            return {
                schedule: '',
                errorReason: "The AI scheduling service is currently overloaded with requests. This is a temporary issue. Please try generating the schedule again in a few moments."
            };
        }
        // For other errors, re-throw or handle as a generic failure
        console.error("An unexpected error occurred during schedule generation:", error);
        return {
            schedule: '',
            errorReason: "An unexpected error occurred while contacting the AI service. Please check the system logs for more details."
        };
    }
  }
);
