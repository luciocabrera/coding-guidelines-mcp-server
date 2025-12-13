export const SEARCH_GUIDELINES_TOOL = {
  name: 'search_guidelines',
  description: 'Search for specific coding guidelines or patterns across all documents',
  inputSchema: {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string',
        description: "Search query (e.g., 'StyleX', 'testing', 'TypeScript')",
      },
    },
    required: ['query'],
  },
};
