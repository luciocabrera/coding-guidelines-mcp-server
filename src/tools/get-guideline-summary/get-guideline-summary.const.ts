/**
 * Get Guideline Summary Tool
 * Retrieves summaries or specific sections from guideline documents
 */

import { GUIDELINES } from '../../resources';
import type { Guideline } from '../../types';

export const GET_GUIDELINE_SUMMARY_TOOL = {
  name: 'get_guideline_summary',
  description: 'Get a summary or specific section from a guideline document',
  inputSchema: {
    type: 'object' as const,
    properties: {
      guideline: {
        type: 'string',
        description: 'Name of the guideline document',
        enum: GUIDELINES.map((g: Guideline) => g.name),
      },
      section: {
        type: 'string',
        description: 'Optional: specific section to retrieve',
      },
    },
    required: ['guideline'],
  },
};
