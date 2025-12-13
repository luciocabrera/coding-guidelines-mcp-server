export const SEARCH_GUIDELINES_TOOL = {
  description: 'Search for specific coding guidelines or patterns across all documents',
  inputSchema: {
    properties: {
      query: {
        description: "Search query (e.g., 'StyleX', 'testing', 'TypeScript')",
        type: 'string',
      },
    },
    required: ['query'],
    type: 'object' as const,
  },
  name: 'search_guidelines',
};
