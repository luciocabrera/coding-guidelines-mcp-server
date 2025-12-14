/**
 * Get Guideline Summary Tool
 * Retrieves summaries or specific sections from guideline documents
 */

import type { Guideline } from '@/types';

import { GUIDELINES } from '@/resources';
import { readGuidelineFile } from '@/utils';

type GetGuidelineSummaryArgs = {
  args: { guideline: string; section?: string };
  guidelinesPath: string;
};

export const getGuidelineSummary = async ({ args, guidelinesPath }: GetGuidelineSummaryArgs) => {
  const { guideline: guidelineName, section } = args;

  const guideline = GUIDELINES.find((g: Guideline) => g.name === guidelineName);
  if (!guideline) {
    return {
      content: [
        {
          text: `Guideline not found: ${guidelineName}. Available: ${GUIDELINES.map((g: Guideline) => g.name).join(', ')}`,
          type: 'text',
        },
      ],
    };
  }

  const content = await readGuidelineFile({ filename: guideline.file, guidelinesPath });

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
            text: `Section "${section}" not found in ${guidelineName}`,
            type: 'text',
          },
        ],
      };
    }

    // Find next section
    // Use .at() for safe array access (Standard 010: Safe Object Property Access)
    const sectionLine = lines.at(sectionStart);

    if (!sectionLine) {
      return {
        content: [
          {
            text: `Section "${section}" not found in ${guidelineName}`,
            type: 'text',
          },
        ],
      };
    }
    const headerLevel = /^#+/.exec(sectionLine)?.[0].length ?? 1;
    const nextSectionIndex = lines.findIndex(
      (line, index) =>
        index > sectionStart && line.startsWith('#') && line.startsWith('#'.repeat(headerLevel)),
    );

    const sectionContent = lines
      .slice(sectionStart, nextSectionIndex === -1 ? undefined : nextSectionIndex)
      .join('\n');

    return {
      content: [{ text: sectionContent, type: 'text' }],
    };
  }

  // Return first few lines as summary
  const summary = content.split('\n').slice(0, 20).join('\n');
  return {
    content: [
      {
        text: `**${guideline.name}**\n\n${summary}\n\n... (use section parameter to get specific sections)`,
        type: 'text',
      },
    ],
  };
};
