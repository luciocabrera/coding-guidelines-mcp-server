/**
 * Get Guideline Summary Tool
 * Retrieves summaries or specific sections from guideline documents
 */

import type { Guideline } from '@/types';

import { GUIDELINES } from '@/resources';

export const GET_GUIDELINE_SUMMARY_TOOL = {
  description: 'Get a summary or specific section from a guideline document',
  inputSchema: {
    properties: {
      guideline: {
        description: 'Name of the guideline document',
        enum: GUIDELINES.map((g: Guideline) => g.name),
        type: 'string',
      },
      section: {
        description: 'Optional: specific section to retrieve',
        type: 'string',
      },
    },
    required: ['guideline'],
    type: 'object' as const,
  },
  name: 'get_guideline_summary',
};
