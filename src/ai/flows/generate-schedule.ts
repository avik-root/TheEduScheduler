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
  prompt: `You are an AI assistant that creates a weekly class schedule. Your goal is to generate a conflict-free and optimal schedule based on the provided information and the following strict rules.

**--- MANDATORY SCHEDULING RULES ---**
You MUST adhere to these rules without exception.
1.  **Faculty Conflict**: No faculty member can be assigned to more than one class at the same time across all sections and years. This is a critical constraint.
2.  **Priority Classes**: Subjects marked as 'priority' must be scheduled as double-duration sessions. This means two consecutive {{timeSettings.classDuration}}-minute classes are combined into a single 100-minute slot.
3.  **Daily Subject Limit (Theory)**: A single theory subject cannot have more than one class scheduled on the same day for any section. If a theory subject has a double class on a given day, no additional class of that same subject can be scheduled on that day for that section. This rule does not apply to labs.
4.  **Credit-to-Class Conversion (Theory)**:
    - 2-credit theory subjects require exactly 2 theory classes per week.
    - 3-credit theory subjects require exactly 3 theory classes per week.
5.  **Lab Class Grouping**:
    - For lab subjects, if a section's student count is more than 30, it MUST be divided into 'Group A' and 'Group B'.
    - Each group (A and B) must have its own separate 100-minute lab session.
    - Each lab subject must be scheduled only once per week for each group.
6.  **Daily Class Distribution**: The schedule must be distributed from Monday to Friday, ensuring that every section has classes scheduled on each of these five days.
7.  **Staggered Start Times**: Sections may start their day at different times within the operating hours to prevent faculty and room overlaps.
8.  **Class Duration**: Each class period is exactly {{timeSettings.classDuration}} minutes long. The next class must start immediately after the previous one with no gaps, except for the designated break time.
9.  **Zero Overlap (Rooms)**: No room can be assigned to more than one class at the same time.
10. **Resource Matching**: Lab-type subjects must be assigned to lab rooms (\`availableLabs\`). Theory-type subjects must be assigned to general-purpose rooms (\`availableRooms\`).
11. **Validation**: Before finishing, you must validate that each subject is scheduled for the correct number of sessions per week as per its credit value and that all constraints are satisfied.

{{#if globalConstraints}}
**--- ADDITIONAL USER CONSTRAINTS ---**
Please also adhere to these user-provided constraints:
{{{globalConstraints}}}
{{/if}}

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
- Class Duration: {{timeSettings.classDuration}} minutes.
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
1.  **Main Heading**: The entire output string MUST start with a level 2 markdown heading containing the Program and Year, formatted exactly like this: \`## {{academicInfo.program}} - {{academicInfo.year}}\`.
2.  **Section Tables**: Generate a **separate Markdown table for each section listed in the input**. Precede each table with a level 3 heading for the section name (e.g., \`### Section 1\`).
3.  **Table Structure**: The first column of each table must be \`Day\`. The subsequent columns must be the {{timeSettings.classDuration}}-minute time slots (e.g., "09:00-09:50"). The rows will represent each active day of the week.
4.  **Cell Format**: Each class cell must be formatted as: **Subject Name (Faculty Abbreviation) in Room/Lab Name**. For split labs, add the group, e.g., \`(Gp A)\`. For no-faculty subjects, use \`(NF)\` for the faculty abbreviation.

Generate the schedule now for all specified sections.
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

