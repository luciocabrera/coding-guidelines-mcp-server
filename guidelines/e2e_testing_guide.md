# E2E Testing & Performance Monitoring Guide

Complete guide for Playwright E2E testing and Lighthouse CI performance monitoring.

---

## 📋 Table of Contents

1. [Playwright E2E Testing](#playwright-e2e-testing)
2. [Lighthouse CI Performance Monitoring](#lighthouse-ci-performance-monitoring)
3. [Setup Instructions](#setup-instructions)
4. [Writing E2E Tests](#writing-e2e-tests)
5. [Performance Budgets](#performance-budgets)
6. [CI/CD Integration](#cicd-integration)
7. [Best Practices](#best-practices)

---

## Playwright E2E Testing

### Overview

Playwright provides reliable end-to-end testing across all modern browsers with:
- ✅ **Cross-browser support** - Chrome, Firefox, Safari, Edge
- ✅ **Mobile emulation** - Test responsive designs
- ✅ **Auto-waiting** - No flaky tests from race conditions
- ✅ **Network interception** - Mock API responses
- ✅ **Screenshots & videos** - Debugging made easy
- ✅ **Parallel execution** - Fast test runs

### Installation

```bash
# Install Playwright
npm install -D @playwright/test

# Install browsers
npx playwright install

# Install system dependencies (Linux)
npx playwright install-deps
```

### Project Structure

```
project/
├── e2e/
│   ├── auth/
│   │   └── login.e2e.test.ts
│   ├── dashboard/
│   │   └── dashboard.e2e.test.ts
│   ├── fixtures.ts
│   ├── global-setup.ts
│   └── global-teardown.ts
├── playwright.config.ts
└── .github/
    └── workflows/
        └── e2e.yml
```

### Running Tests

```bash
# Run all tests
npx playwright test

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run specific test file
npx playwright test e2e/auth/login.e2e.test.ts

# Run tests in specific browser
npx playwright test --project=chromium

# Run tests with UI mode (interactive debugging)
npx playwright test --ui

# Generate test code
npx playwright codegen http://localhost:3000

# View test report
npx playwright show-report
```

---

## Lighthouse CI Performance Monitoring

### Overview

Lighthouse CI automatically monitors:
- ✅ **Core Web Vitals** - LCP, FID, CLS
- ✅ **Performance scores** - Overall page performance
- ✅ **Accessibility** - WCAG compliance
- ✅ **Best practices** - Security and modern standards
- ✅ **SEO** - Search engine optimization
- ✅ **Bundle sizes** - JavaScript and asset budgets

### Installation

```bash
# Install Lighthouse CI
npm install -g @lhci/cli

# Or as dev dependency
npm install -D @lhci/cli
```

### Running Locally

```bash
# Build your app
npm run build

# Run Lighthouse CI
lhci autorun

# View results
lhci open
```

### Performance Budgets

Configure in `lighthouserc.js`:

```javascript
{
  assert: {
    assertions: {
      'categories:performance': ['error', { minScore: 0.9 }],
      'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
      'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
      'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      'total-blocking-time': ['error', { maxNumericValue: 300 }],
    }
  }
}
```

---

## Setup Instructions

### 1. Install Dependencies

```bash
# Playwright
npm install -D @playwright/test

# Lighthouse CI
npm install -D @lhci/cli

# Install browsers
npx playwright install
```

### 2. Copy Configuration Files

Copy these files from the artifacts:
- `playwright.config.ts`
- `lighthouserc.js`
- `e2e/fixtures.ts`
- `e2e/global-setup.ts`
- `e2e/global-teardown.ts`

### 3. Update package.json Scripts

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:report": "playwright show-report",
    "lighthouse": "lhci autorun",
    "lighthouse:open": "lhci open"
  }
}
```

### 4. Set Environment Variables

Create `.env.test`:

```bash
# E2E Test Credentials
E2E_USERNAME=test@example.com
E2E_PASSWORD=testpassword123

# Base URL
BASE_URL=http://localhost:3000
```

### 5. GitHub Secrets

Add these secrets to your GitHub repository:

```bash
E2E_USERNAME=your_test_user
E2E_PASSWORD=your_test_password
LHCI_GITHUB_APP_TOKEN=your_lighthouse_token
```

---

## Writing E2E Tests

### Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await page.goto('/');
  });

  test('should do something', async ({ page }) => {
    // Arrange - Set up test state
    
    // Act - Perform user actions
    await page.click('button');
    
    // Assert - Verify outcomes
    await expect(page.locator('h1')).toHaveText('Expected Text');
  });
});
```

### Page Object Model (POM)

```typescript
// e2e/pages/LoginPage.ts
import { Page } from '@playwright/test';

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  async login(email: string, password: string): Promise<void> {
    await this.page.fill('[name="email"]', email);
    await this.page.fill('[name="password"]', password);
    await this.page.click('button[type="submit"]');
  }

  async getErrorMessage(): Promise<string | null> {
    const error = this.page.locator('[role="alert"]');
    return error.isVisible() ? await error.textContent() : null;
  }
}

// Usage in test
import { LoginPage } from './pages/LoginPage';

test('login flow', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('user@example.com', 'password');
});
```

### Common Patterns

#### Waiting for Elements

```typescript
// Wait for element to be visible
await page.waitForSelector('button', { state: 'visible' });

// Wait for navigation
await page.waitForURL('**/dashboard');

// Wait for network request
await page.waitForResponse(resp => 
  resp.url().includes('/api/users') && resp.status() === 200
);

// Wait for custom condition
await page.waitForFunction(() => 
  document.querySelectorAll('.item').length > 5
);
```

#### Network Interception

```typescript
test('mock API responses', async ({ page }) => {
  // Mock API call
  await page.route('**/api/users', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        users: [{ id: 1, name: 'Test User' }]
      })
    });
  });

  await page.goto('/users');
  // API will return mocked data
});
```

#### File Upload

```typescript
test('upload file', async ({ page }) => {
  await page.goto('/upload');
  
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles('./test-file.pdf');
  
  await page.click('button[type="submit"]');
  await expect(page.locator('.success')).toBeVisible();
});
```

#### Authentication State

```typescript
// Save authentication state
test('save auth state', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'user@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');
  
  // Save storage state
  await page.context().storageState({ 
    path: 'e2e/.auth/user.json' 
  });
});

// Use saved authentication
test.use({ 
  storageState: 'e2e/.auth/user.json' 
});

test('authenticated test', async ({ page }) => {
  await page.goto('/dashboard');
  // Already logged in
});
```

#### Screenshots and Videos

```typescript
test('visual test', async ({ page }) => {
  await page.goto('/');
  
  // Take screenshot
  await page.screenshot({ 
    path: 'screenshots/homepage.png',
    fullPage: true 
  });
  
  // Compare screenshot (requires @playwright/test)
  await expect(page).toHaveScreenshot('homepage.png');
});
```

---

## Performance Budgets

### Core Web Vitals Targets

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| **LCP** (Largest Contentful Paint) | ≤ 2.5s | 2.5s - 4.0s | > 4.0s |
| **FID** (First Input Delay) | ≤ 100ms | 100ms - 300ms | > 300ms |
| **CLS** (Cumulative Layout Shift) | ≤ 0.1 | 0.1 - 0.25 | > 0.25 |
| **FCP** (First Contentful Paint) | ≤ 1.8s | 1.8s - 3.0s | > 3.0s |
| **TBT** (Total Blocking Time) | ≤ 200ms | 200ms - 600ms | > 600ms |

### Bundle Size Budgets

```javascript
// lighthouserc.js
{
  'total-byte-weight': ['error', { maxNumericValue: 1000000 }], // 1MB
  'bootup-time': ['warn', { maxNumericValue: 3500 }],
  'dom-size': ['warn', { maxNumericValue: 1500 }],
}
```

### Custom Audits

Create custom audits for your specific needs:

```javascript
// lighthouse/custom-audits/bundle-size.js
class BundleSizeAudit extends Audit {
  static get meta() {
    return {
      id: 'custom-bundle-size',
      title: 'Bundle size within budget',
      description: 'Checks if bundle sizes meet requirements',
    };
  }

  static audit(artifacts) {
    // Your audit logic
    return {
      score: 1,
      numericValue: 0,
    };
  }
}
```

---

## CI/CD Integration

### GitHub Actions Workflow

Both E2E and Lighthouse tests run automatically:

```yaml
# Triggers
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
```

### Viewing Results

#### Playwright Reports
- Uploaded as GitHub Actions artifacts
- Available in PR comments
- HTML report with traces and videos

#### Lighthouse Results
- Posted as PR comments
- Scores and recommendations
- Historical trends (with LHCI server)

---

## Best Practices

### E2E Testing

#### ✅ DO:
- Test user journeys, not implementation
- Use data-testid for dynamic content
- Keep tests independent
- Use Page Object Models for reusability
- Test happy paths AND error states
- Mock external API calls
- Use authentication state for speed
- Run in multiple browsers

#### ❌ DON'T:
- Test implementation details
- Use CSS selectors that may change
- Share state between tests
- Test third-party integrations
- Ignore flaky tests
- Over-test edge cases
- Skip mobile testing

### Performance Monitoring

#### ✅ DO:
- Set realistic budgets
- Monitor trends over time
- Test on mobile networks
- Measure real user metrics
- Profile in production mode
- Test on CI/CD pipeline
- Address warnings promptly

#### ❌ DON'T:
- Ignore performance regressions
- Set unrealistic budgets
- Test only on fast connections
- Skip accessibility checks
- Optimize prematurely
- Test development builds

---

## Troubleshooting

### Playwright Issues

**Tests timing out:**
```typescript
// Increase timeout
test.setTimeout(60000);

// Or globally in config
timeout: 60000
```

**Element not found:**
```typescript
// Use auto-waiting locators
await page.locator('button').click();

// Check visibility
await expect(page.locator('button')).toBeVisible();
```

**Flaky tests:**
```typescript
// Use strict locators
await page.locator('button:has-text("Submit")').click();

// Wait for network idle
await page.goto('/', { waitUntil: 'networkidle' });
```

### Lighthouse Issues

**Low scores in CI but good locally:**
- CI runs on slower machines
- Adjust throttling settings
- Use more runs for median: `numberOfRuns: 5`

**Different scores each run:**
- Normal variation ±5 points
- Use median of multiple runs
- Focus on trends, not single scores

---

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Lighthouse CI Documentation](https://github.com/GoogleChrome/lighthouse-ci)
- [Core Web Vitals](https://web.dev/vitals/)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)

---

**Version:** 1.0.0  
**Last Updated:** December 2025
