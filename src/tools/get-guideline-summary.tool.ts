/**
 * Get Guideline Summary Tool
 * Retrieves summaries or specific sections from guideline documents
 */

import type { Guideline } from '../types.js';
import { GUIDELINES } from '../resources/index.js';
import { readGuidelineFile } from '../utils/index.js';

export const getGuidelineSummaryTool = {
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

export async function handleGetGuidelineSummary(
  guidelinesPath: string,
  args: { guideline: string; section?: string },
) {
  const { guideline: guidelineName, section } = args;

  const guideline = GUIDELINES.find((g: Guideline) => g.name === guidelineName);
  if (!guideline) {
    return {
      content: [
        {
          type: 'text',
          text: `Guideline not found: ${guidelineName}. Available: ${GUIDELINES.map((g: Guideline) => g.name).join(', ')}`,
        },
      ],
    };
  }

  const content = await readGuidelineFile(guidelinesPath, guideline.file);

  if (section) {
    // Simple section extraction based on markdown headers
    const lines = content.split('\n');
    const sectionStart = lines.findIndex(
      (line) => line.toLowerCase().includes(section.toLowerCase()) && line.startsWith('#'),
    );

    if (sectionStart === -1) {
      return {
        content: [
          {
            type: 'text',
            text: `Section "${section}" not found in ${guidelineName}`,
          },
        ],
      };
    }

    // A section runs until the next header at the same or a shallower depth, so
    // nested subsections stay part of the section that contains them.
    const sectionLevel = lines[sectionStart]?.match(/^#+/)?.[0].length ?? 1;
    const nextSectionIndex = lines.findIndex((line, idx) => {
      if (idx <= sectionStart) {
        return false;
      }
      const level = line.match(/^#+/)?.[0].length;
      return level !== undefined && level <= sectionLevel;
    });

    const sectionContent = lines
      .slice(sectionStart, nextSectionIndex === -1 ? undefined : nextSectionIndex)
      .join('\n');

    return {
      content: [{ type: 'text', text: sectionContent }],
    };
  }

  // Return first few lines as summary
  const summary = content.split('\n').slice(0, 20).join('\n');
  return {
    content: [
      {
        type: 'text',
        text: `**${guideline.name}**\n\n${summary}\n\n... (use section parameter to get specific sections)`,
      },
    ],
  };
}
