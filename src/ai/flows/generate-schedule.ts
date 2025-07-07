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

const SubjectAssignmentSchema = z.object({
  sectionName: z.string(),
  facultyAbbreviation: z.string().describe("Abbreviation of the assigned faculty. Use 'NF' if no specific faculty is assigned."),
});

const SubjectConfigForAISchema = z.object({
  name: z.string(),
  code: z.string(),
  type: z.string(),
  theoryCredits: z.number().optional(),
  labCredits: z.number().optional(),
  isPriority: z.boolean().describe("Whether this is a priority subject that MUST be a double period."),
  assignments: z.array(SubjectAssignmentSchema).describe("Defines which faculty teaches this subject to which section."),
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
    subjects: z.array(SubjectConfigForAISchema),
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
  prompt: `You are an expert AI assistant that creates a weekly class schedule. Your goal is to generate a conflict-free and optimal schedule based on the provided information and a strict set of rules.

**--- CORE SCHEDULING RULES ---**
You MUST adhere to the following rules without exception:
1.  **Faculty Conflict**: No faculty member can be assigned to more than one class at the same time. This applies across ALL sections. Classes assigned to 'NF' (No Faculty) are exempt from this rule.
2.  **Room Conflict**: No room or lab can be assigned to more than one class at the same time.
3.  **Priority Subjects**: Subjects marked as 'isPriority: true' **MUST** be scheduled as double-duration sessions (e.g., spanning two consecutive 50-minute slots like "09:00-10:40").
4.  **Daily Subject Limit (Theory)**: For a given section, a single theory subject **MUST NOT** be scheduled more than once per day. This means if a theory subject has a double-period on Monday, it cannot have another single or double period on Monday. This rule does not apply to lab subjects.
5.  **Credit Distribution (Theory)**: The total number of periods per week for a theory subject depends on its credits:
    - 2-credit theory: **Exactly two** 50-minute single-period classes per week.
    - 3-credit theory: **Exactly three** 50-minute periods per week, scheduled as **one double-period (100 mins)** and **one single-period (50 mins)**.
    - 4-credit theory: **Exactly four** 50-minute periods per week, scheduled as **two double-periods (100 mins each)** on two different days.
6.  **Lab Scheduling**:
    - Lab subjects (typically 1 credit) **MUST** be scheduled as a single 100-minute double-period session, **once per week**.
    - If a section's student count is over 30, it **MUST** be split into 'Gp A' and 'Gp B' for labs. Each group gets its own separate 100-minute lab session once per week.
    - **Optimization Rule**: If possible, schedule the labs for Gp A and Gp B of the same section for *different subjects at the same time* to optimize lab usage (e.g., Section 1 Gp A has Physics Lab while Section 1 Gp B has Chemistry Lab in the same time slot, using two different lab rooms).
7.  **Daily Class Distribution**: Ensure each section has classes scheduled every active day (e.g., Monday to Friday). Avoid leaving any active day empty for any section.
8.  **Time & Resource Allocation**:
    - All classes must be within the specified start and end times.
    - **NOTHING** can be scheduled during the designated Break Slot.
    - Lab subjects must be assigned to rooms from the 'availableLabs' list. Theory subjects must be assigned to rooms from the 'availableRooms' list.

**--- SCHEDULING CONTEXT ---**
- Department: {{academicInfo.department}}, Program: {{academicInfo.program}}, Year: {{academicInfo.year}}

**Sections & Student Counts:**
{{#each sections}}
- {{name}}: {{studentCount}} students. (Note: If student count > 30, split lab classes into Gp A and Gp B).
{{/each}}

**Time & Day Constraints:**
- Daily Timings: From {{timeSettings.startTime}} to {{timeSettings.endTime}}
- Class Duration: {{timeSettings.classDuration}} minutes per period.
- Break Slot: {{timeSettings.breakTime}}. **Do not schedule anything here.**
- Active Weekdays: {{#each activeDays}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

**Available Resources:**
- Classrooms: {{#if availableRooms}}{{#each availableRooms}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}
- Labs: {{#if availableLabs}}{{#each availableLabs}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}

**Faculty Information:**
{{#each faculty}}
- **{{name}} ({{abbreviation}})**: Max {{weeklyMaxHours}} hours/week. Off on {{#if weeklyOffDays}}{{#each weeklyOffDays}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}.
{{/each}}

**Subjects & Assignments to Schedule:**
{{#each subjects}}
- **{{name}} ({{code}})**:
  - Type: {{type}}{{#if isPriority}} (PRIORITY){{/if}}
  - Credits: Theory={{#if theoryCredits}}{{theoryCredits}}{{else}}0{{/if}}, Lab={{#if labCredits}}{{labCredits}}{{else}}0{{/if}}
  - Assignments:
    {{#each assignments}}
    - Section: **{{sectionName}}**, Faculty: **{{facultyAbbreviation}}**
    {{/each}}
{{/each}}

**--- OUTPUT FORMATTING ---**
1.  **Main Heading**: The entire output string **MUST** start with a level 2 markdown heading containing the Program and Year, formatted exactly like this: \`## {{academicInfo.program}} - {{academicInfo.year}}\`.
2.  **Section Tables**: Generate a **separate Markdown table for each section** that has assigned classes. Precede each table with a level 3 heading for the section name (e.g., \`### Section 1\`).
3.  **Table Structure**: The first column of each table must be 'Day'. The subsequent columns must be the {{timeSettings.classDuration}}-minute time slots (e.g., "09:00-09:50"). For double-periods, place the class in the starting slot and leave the next slot empty or use a placeholder like '-'.
4.  **Cell Format**: Each class cell must be formatted as: \`Subject Name (Faculty Abbreviation) in Room/Lab Name\`. For split labs, add the group, e.g., '(Gp A)'. For subjects with no faculty assigned, use '(NF)'.

**--- ERROR HANDLING ---**
If you are completely unable to generate a valid schedule that satisfies all core rules, you **MUST** set the 'schedule' output field to an empty string and provide a clear, user-friendly explanation in the 'errorReason' field. Describe the specific, most critical conflict you encountered (e.g., "Faculty Conflict: Dr. Alan Grant is double-booked on Monday at 10:00 AM.", or "Resource Shortage: Not enough lab rooms available on Tuesday afternoons.").

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
