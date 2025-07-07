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
        classDuration: z.number().describe("The duration of each class in minutes."),
    }),
    activeDays: z.array(z.string()),
    globalConstraints: z.string().optional().describe("Additional high-level constraints for the AI to follow."),
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
  prompt: `You are an AI assistant that creates a weekly class schedule. Your goal is to generate a conflict-free and optimal schedule based on the provided information and a strict set of rules.

**--- CORE SCHEDULING RULES ---**
You MUST adhere to the following rules without exception:
1.  **Faculty Conflict**: No faculty member can be assigned to more than one class at the same time across any section. Classes with "(NF)" (No Faculty) are exempt from this rule and can be scheduled concurrently with other classes for different sections.
2.  **Room Conflict**: No room or lab can be assigned to more than one class at the same time.
3.  **Priority Subjects**: Subjects marked as 'isPriority: true' MUST be scheduled as double-duration sessions (two consecutive periods, e.g., "09:00-10:40").
4.  **Daily Subject Limit (Theory)**: A single theory subject cannot be scheduled for more than one session (single or double) on the same day for the same section. This rule does not apply to lab subjects.
5.  **Credit Distribution (Theory)**:
    - 2-credit theory subjects require exactly two 50-minute classes per week.
    - 3-credit theory subjects require exactly three 50-minute classes per week, distributed as one double-period (100 mins) and one single-period (50 mins).
    - 4-credit theory subjects require exactly four 50-minute classes per week, distributed as two double-periods on two different days.
6.  **Lab Scheduling**:
    - Lab subjects (1 credit) MUST be scheduled as a single 100-minute double-period session once per week.
    - If a section's student count is over 30, it MUST be split into 'Gp A' and 'Gp B' for labs. Each group gets its own separate 100-minute lab session once per week. The groups can be scheduled in different labs at the same time if labs are available.
7.  **Daily Class Distribution**: Ensure each section has classes scheduled every active day (e.g., Monday to Friday).
8.  **Time Allocation**: Use the provided college operating hours. Stagger start times for different sections if necessary to resolve faculty or room conflicts. Do not schedule anything during the Break Slot.
9.  **Room Allocation**: Room capacity and type (lab or class) must match the subject type. Labs must be assigned only to lab-type rooms.

{{#if globalConstraints}}
**--- USER-PROVIDED CONSTRAINTS ---**
In addition to the core rules, please adhere to these user-provided constraints:
{{{globalConstraints}}}
{{/if}}

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

**--- OUTPUT FORMATTING ---**
1.  **Main Heading**: The entire output string MUST start with a level 2 markdown heading containing the Program and Year, formatted exactly like this: ## {{academicInfo.program}} - {{academicInfo.year}}.
2.  **Section Tables**: Generate a **separate Markdown table for each section listed in the input**. Precede each table with a level 3 heading for the section name (e.g., ### Section 1).
3.  **Table Structure**: The first column of each table must be 'Day'. The subsequent columns must be the {{timeSettings.classDuration}}-minute time slots (e.g., "09:00-09:50"). Double-periods should span two columns.
4.  **Cell Format**: Each class cell must be formatted as: **Subject Name (Faculty Abbreviation) in Room/Lab Name**. For split labs, add the group, e.g., '(Gp A)'. For subjects with no faculty assigned, use '(NF)' for the faculty abbreviation.

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
    const {output} = await prompt(input);
    return output!;
  }
);
