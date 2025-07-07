import {genkit} from 'genkit';
import {groq} from 'genkitx-groq';

export const ai = genkit({
  plugins: [groq],
  model: 'groq/llama3-8b-8192',
});
