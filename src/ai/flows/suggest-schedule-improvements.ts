// This file is machine-generated - edit at your own risk!

'use server';

/**
 * @fileOverview AI agent that suggests improvements to existing schedules.
 *
 * - suggestScheduleImprovements - A function that suggests improvements to an existing schedule by identifying conflicts, inefficiencies, or opportunities for optimization.
 * - SuggestScheduleImprovementsInput - The input type for the suggestScheduleImprovements function.
 * - SuggestScheduleImprovementsOutput - The return type for the suggestScheduleImprovements function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestScheduleImprovementsInputSchema = z.object({
  scheduleDetails: z
    .string()
    .describe('The details of the existing schedule including time slots, assigned personnel, and activities.'),
  constraints: z
    .string()
    .optional()
    .describe('Any constraints that should be considered when suggesting improvements such as personnel availability or resource limitations.'),
});
export type SuggestScheduleImprovementsInput = z.infer<
  typeof SuggestScheduleImprovementsInputSchema
>;

const SuggestScheduleImprovementsOutputSchema = z.object({
  suggestedImprovements: z
    .string()
    .describe(
      'A detailed list of suggested improvements to the schedule, including specific changes to resolve conflicts, improve efficiency, or optimize resource utilization.'
    ),
  rationale: z
    .string()
    .describe(
      'Explanation of why each improvement is suggested, based on identified conflicts, inefficiencies, or opportunities for optimization.'
    ),
});
export type SuggestScheduleImprovementsOutput = z.infer<
  typeof SuggestScheduleImprovementsOutputSchema
>;

export async function suggestScheduleImprovements(
  input: SuggestScheduleImprovementsInput
): Promise<SuggestScheduleImprovementsOutput> {
  return suggestScheduleImprovementsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestScheduleImprovementsPrompt',
  input: {schema: SuggestScheduleImprovementsInputSchema},
  output: {schema: SuggestScheduleImprovementsOutputSchema},
  prompt: `You are an AI schedule optimization expert. Review the provided schedule details and suggest improvements based on the identified conflicts, inefficiencies, and opportunities for optimization.

Schedule Details: {{{scheduleDetails}}}
Constraints: {{{constraints}}}

Provide a detailed list of suggested improvements and a rationale for each suggestion.`,
});

const suggestScheduleImprovementsFlow = ai.defineFlow(
  {
    name: 'suggestScheduleImprovementsFlow',
    inputSchema: SuggestScheduleImprovementsInputSchema,
    outputSchema: SuggestScheduleImprovementsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
