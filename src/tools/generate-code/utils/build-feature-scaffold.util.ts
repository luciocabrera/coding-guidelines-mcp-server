import { SHARED_GUIDELINES_NOTES } from '../generate-code.const';
import type { GenerateCodeResult } from '../generate-code.types';

import { buildComponentScaffold } from './build-component-scaffold.util';
import { toPascalCase } from './to-pascal-case.util';

export function buildFeatureScaffold(name: string, requirements?: string): GenerateCodeResult {
  const featureName = toPascalCase(name || 'Feature');
  const componentName = `${featureName}Card`;
  const base = `Feature bundle: ${featureName}

Structure:
- src/features/${featureName}/components/${componentName}/${componentName}.tsx
- src/features/${featureName}/components/${componentName}/${componentName}.styles.ts
- src/features/${featureName}/components/${componentName}/${componentName}.types.ts
- src/features/${featureName}/components/${componentName}/index.ts
- src/features/${featureName}/hooks/use${featureName}.hook.ts
- src/features/${featureName}/services/${featureName}Api.service.ts
- src/features/${featureName}/index.ts (barrel)
`;

  const componentSnippet = buildComponentScaffold(componentName, undefined, false, false);
  const hookSnippet = `### use${featureName}.hook.ts\n\n\`\`\`ts\nimport { useEffect, useState } from "react";

type Use${featureName}State = { readonly loading: boolean; readonly data: string | null; };

type Use${featureName}Result = Use${featureName}State & { readonly refresh: () => Promise<void>; };

export const use${featureName} = (): Use${featureName}Result => {
  const [state, setState] = useState<Use${featureName}State>({ loading: false, data: null });

  const refresh = async () => {
    setState({ loading: true, data: null });
    // TODO: call service
    setState({ loading: false, data: "example" });
  };

  useEffect(() => {
    refresh().catch(() => setState({ loading: false, data: null }));
  }, []);

  return { ...state, refresh };
};
\`\`\``;

  const serviceSnippet = `### ${featureName}Api.service.ts\n\n\`\`\`ts\nimport { z } from "zod";

const ExampleSchema = z.object({ message: z.string() });

export const fetch${featureName} = async () => {
  const response = await fetch("/api/example");
  const json = await response.json();
  const parsed = ExampleSchema.parse(json);
  return parsed;
};
\`\`\``;

  const extras = requirements ? `\nRequirements: ${requirements}\n` : '';
  return {
    text: `${SHARED_GUIDELINES_NOTES}\n${extras}\n${base}\n${componentSnippet.text}\n\n${hookSnippet}\n\n${serviceSnippet}`,
    files: undefined,
    commands: ['npm run format', 'npm run lint', 'npm run typecheck', 'npm test -- --coverage'],
  };
}
