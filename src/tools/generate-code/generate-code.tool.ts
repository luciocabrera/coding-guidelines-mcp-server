import type { GenerateCodeArgs } from './generate-code.types.js';
import { buildBootstrapPlan, buildComponentScaffold, buildFeatureScaffold } from './utils';

export function generateCode(args: GenerateCodeArgs) {
  const { task, name, requirements, includeTests } = args;

  switch (task) {
    case 'component':
      return buildComponentScaffold(name, requirements, includeTests);
    case 'feature':
      return buildFeatureScaffold(name, requirements);
    case 'bootstrap':
      return buildBootstrapPlan(requirements);
    case 'hook':
      return buildFeatureScaffold(`${name}Hook`, requirements);
    default:
      return { content: [{ type: 'text', text: 'Unknown task' }] };
  }
}
