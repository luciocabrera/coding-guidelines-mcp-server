# Testing Standards & Best Practices

Comprehensive guide for writing tests that align with our enterprise coding standards.

---

## 📋 Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Test Organization](#test-organization)
3. [Writing Tests](#writing-tests)
4. [Coverage Requirements](#coverage-requirements)
5. [Testing Patterns](#testing-patterns)
6. [Performance Testing](#performance-testing)
7. [CI/CD Integration](#cicd-integration)

---

## Testing Philosophy

### Core Principles

1. **Test Behavior, Not Implementation** - Focus on what users see and do
2. **Arrange-Act-Assert Pattern** - Structure all tests consistently
3. **Isolation** - Each test should be independent
4. **Readability** - Tests are documentation
5. **Fast Feedback** - Tests should run quickly

### What to Test

✅ **DO TEST:**

- User interactions (clicks, typing, navigation)
- Component rendering and props
- State changes and side effects
- Error states and edge cases
- Accessibility features
- Integration between components

❌ **DON'T TEST:**

- Implementation details (internal state, private methods)
- Third-party libraries
- Styling (unless behavior-related)
- TypeScript types (compiler handles this)

---

## Test Organization

### File Structure

```
src/
├── shared/
│   └── components/
│       └── Button/
│           ├── Button.tsx
│           ├── Button.test.tsx       # Unit tests
│           ├── Button.styles.ts
│           └── index.ts
├── features/
│   └── auth/
│       ├── components/
│       │   └── LoginForm/
│       │       ├── LoginForm.tsx
│       │       ├── LoginForm.test.tsx
│       │       └── LoginForm.integration.test.tsx  # Integration tests
│       └── auth.e2e.test.ts         # E2E tests
└── test/
    ├── setup.ts                     # Test configuration
    ├── test-utils.tsx               # Shared test utilities
    └── mocks/
        ├── handlers.ts              # MSW handlers
        └── server.ts                # MSW server
```

### File Naming

- **Unit tests:** `*.test.tsx`
- **Integration tests:** `*.integration.test.tsx`
- **E2E tests:** `*.e2e.test.ts`

---

## Writing Tests

### Basic Test Structure

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  // Setup
  beforeEach(() => {
    // Reset state if needed
  });

  describe('Feature Group', () => {
    it('should do something specific', async () => {
      // Arrange - Set up test data and environment
      const handleClick = vi.fn();
      const user = userEvent.setup();

      // Act - Perform the action
      renderWithProviders(<ComponentName onClick={handleClick} />);
      const button = screen.getByRole('button');
      await user.click(button);

      // Assert - Verify the outcome
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });
});
```

### Test Naming Conventions

```typescript
// ✅ Good: Descriptive, behavior-focused
it('calls onSubmit with form data when submit button is clicked', () => {});
it('displays error message when email is invalid', () => {});
it('disables submit button while form is submitting', () => {});

// ❌ Bad: Implementation-focused
it('sets state to loading', () => {});
it('calls handleClick', () => {});
it('renders correctly', () => {});
```

### Query Priority

Use queries in this order (most to least preferred):

```typescript
// 1. Accessible to everyone (best)
screen.getByRole('button', { name: /submit/i });
screen.getByLabelText('Email');
screen.getByPlaceholderText('Enter your email');
screen.getByText('Welcome');

// 2. Semantic queries
screen.getByAltText('Profile picture');
screen.getByTitle('Close');

// 3. Test IDs (last resort)
screen.getByTestId('custom-element');
```

---

## Coverage Requirements

### Minimum Thresholds

| Metric     | Threshold | Enforced By |
| ---------- | --------- | ----------- |
| Lines      | 80%       | Vitest      |
| Functions  | 80%       | Vitest      |
| Branches   | 80%       | Vitest      |
| Statements | 80%       | Vitest      |

### Running Coverage

```bash
# Generate coverage report
npm run test:coverage

# View coverage in browser
open coverage/index.html

# Watch mode with coverage
npm run test:watch
```

### Coverage Exceptions

Files excluded from coverage (configured in `vitest.config.ts`):

- `*.styles.ts` - Tested via component tests
- `*.types.ts` - Type-only files
- `index.ts` - Barrel files
- `*.config.*` - Configuration files
- Test files themselves

---

## Testing Patterns

### Testing Components with Props

```typescript
type ButtonProps = {
  readonly label: string;
  readonly onClick: () => void;
  readonly variant?: 'primary' | 'secondary';
};

describe('Button', () => {
  it('renders with different variants', () => {
    const { rerender } = renderWithProviders(
      <Button label="Primary" onClick={() => {}} variant="primary" />
    );

    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(<Button label="Secondary" onClick={() => {}} variant="secondary" />);

    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
```

### Testing Async Operations

```typescript
describe('UserProfile', () => {
  it('loads and displays user data', async () => {
    renderWithProviders(<UserProfile userId="123" />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // Verify data is displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('handles loading errors gracefully', async () => {
    // Mock failed request
    server.use(
      http.get('/api/users/:id', () => {
        return HttpResponse.json({ error: 'Not found' }, { status: 404 });
      })
    );

    renderWithProviders(<UserProfile userId="999" />);

    await waitFor(() => {
      expect(screen.getByText(/error loading user/i)).toBeInTheDocument();
    });
  });
});
```

### Testing Forms

```typescript
describe('LoginForm', () => {
  it('submits form with valid data', async () => {
    const handleSubmit = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(<LoginForm onSubmit={handleSubmit} />);

    // Fill out form
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');

    // Submit
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Verify
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('displays validation errors for invalid input', async () => {
    const user = userEvent.setup();

    renderWithProviders(<LoginForm onSubmit={() => {}} />);

    // Submit without filling form
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Check for error messages
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });
});
```

### Testing Hooks

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useUserData } from './useUserData.hook';

describe('useUserData', () => {
  it('fetches user data on mount', async () => {
    const { result } = renderHook(() => useUserData({ userId: '123' }));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual({
      id: '123',
      name: 'John Doe',
    });
  });

  it('refetches when userId changes', async () => {
    const { result, rerender } = renderHook(({ userId }) => useUserData({ userId }), {
      initialProps: { userId: '123' },
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Change userId
    rerender({ userId: '456' });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.data?.id).toBe('456');
    });
  });
});
```

### Testing Context

```typescript
describe('ThemeContext', () => {
  it('provides theme to child components', () => {
    renderWithProviders(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    expect(screen.getByText(/dark mode/i)).toBeInTheDocument();
  });

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderWithProviders(<ThemeConsumer />);
    }).toThrow('useTheme must be used within ThemeProvider');

    spy.mockRestore();
  });
});
```

### Testing Error Boundaries

```typescript
describe('ErrorBoundary', () => {
  it('catches and displays error', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderWithProviders(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

    spy.mockRestore();
  });
});
```

---

## Performance Testing

### Measuring Render Performance

```typescript
import { Profiler } from 'react';

describe('PerformanceTest', () => {
  it('renders efficiently', () => {
    const onRender = vi.fn();

    renderWithProviders(
      <Profiler id="test" onRender={onRender}>
        <HeavyComponent items={largeDataSet} />
      </Profiler>
    );

    const [, , actualDuration] = onRender.mock.calls[0];

    // Assert render time is under threshold
    expect(actualDuration).toBeLessThan(16); // 60fps = 16ms per frame
  });
});
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests with coverage
        run: npm run test:ci

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
          flags: unittests
          fail_ci_if_error: true
```

### Pre-commit Hook

Tests run automatically on commit (configured in Husky):

```bash
# .husky/pre-commit
npm run test -- --run --changed
```

---

## Best Practices Checklist

- [ ] Tests are independent and can run in any order
- [ ] Using `renderWithProviders` for consistent test environment
- [ ] Following Arrange-Act-Assert pattern
- [ ] Using semantic queries (getByRole, getByLabelText)
- [ ] Testing user behavior, not implementation
- [ ] Avoiding brittle selectors (CSS classes, test IDs)
- [ ] Cleaning up side effects (timers, listeners)
- [ ] Using async utilities (waitFor, findBy) for async code
- [ ] Mocking external dependencies (API calls, timers)
- [ ] Testing error states and edge cases
- [ ] Achieving 80%+ coverage on new code
- [ ] Tests are readable and well-documented

---

**Last Updated:** December 2025  
**Version:** 1.0.0
