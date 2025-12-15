/**
 * Dark Mode Testing Script
 * Tests theme toggle functionality, localStorage persistence, and visual consistency
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}${msg}${colors.reset}`),
};

// Admin pages to test
const adminPages = [
  '/admin/dashboard',
  '/admin/users',
  '/admin/courses',
  '/admin/feed-management',
  '/admin/member-management',
  '/admin/settings',
];

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: [],
};

async function setupBrowser() {
  log.info('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  return { browser, page };
}

async function loginAsAdmin(page) {
  log.info('Logging in as admin...');
  
  try {
    await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle0' });
    
    // Fill in login form
    await page.type('input[type="email"]', 'admin@example.com');
    await page.type('input[type="password"]', 'Admin123!');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
    
    log.success('Successfully logged in as admin');
    return true;
  } catch (error) {
    log.error(`Login failed: ${error.message}`);
    return false;
  }
}

async function testThemeToggleButton(page) {
  log.section('Testing Theme Toggle Button');
  
  try {
    // Check if theme toggle button exists
    const toggleButton = await page.$('button[aria-label*="mode"]');
    
    if (!toggleButton) {
      log.error('Theme toggle button not found');
      testResults.failed++;
      testResults.details.push({ test: 'Theme Toggle Button', status: 'FAILED', reason: 'Button not found' });
      return false;
    }
    
    log.success('Theme toggle button found');
    
    // Check button accessibility
    const ariaLabel = await page.$eval('button[aria-label*="mode"]', el => el.getAttribute('aria-label'));
    if (ariaLabel) {
      log.success(`Button has aria-label: "${ariaLabel}"`);
    } else {
      log.warning('Button missing aria-label');
      testResults.warnings++;
    }
    
    testResults.passed++;
    testResults.details.push({ test: 'Theme Toggle Button', status: 'PASSED' });
    return true;
  } catch (error) {
    log.error(`Theme toggle button test failed: ${error.message}`);
    testResults.failed++;
    testResults.details.push({ test: 'Theme Toggle Button', status: 'FAILED', reason: error.message });
    return false;
  }
}

async function testThemeToggleFunctionality(page) {
  log.section('Testing Theme Toggle Functionality');
  
  try {
    // Get initial theme
    const initialTheme = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    });
    
    log.info(`Initial theme: ${initialTheme}`);
    
    // Click toggle button
    await page.click('button[aria-label*="mode"]');
    
    // Wait for theme change
    await page.waitForTimeout(500);
    
    // Get new theme
    const newTheme = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    });
    
    log.info(`New theme: ${newTheme}`);
    
    if (initialTheme !== newTheme) {
      log.success('Theme toggle works correctly');
      testResults.passed++;
      testResults.details.push({ test: 'Theme Toggle Functionality', status: 'PASSED' });
      return true;
    } else {
      log.error('Theme did not change after toggle');
      testResults.failed++;
      testResults.details.push({ test: 'Theme Toggle Functionality', status: 'FAILED', reason: 'Theme did not change' });
      return false;
    }
  } catch (error) {
    log.error(`Theme toggle functionality test failed: ${error.message}`);
    testResults.failed++;
    testResults.details.push({ test: 'Theme Toggle Functionality', status: 'FAILED', reason: error.message });
    return false;
  }
}

async function testLocalStoragePersistence(page) {
  log.section('Testing localStorage Persistence');
  
  try {
    // Set theme to dark
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('admin-theme', 'dark');
    });
    
    log.info('Set theme to dark and stored in localStorage');
    
    // Reload page
    await page.reload({ waitUntil: 'networkidle0' });
    
    // Check if theme persisted
    const persistedTheme = await page.evaluate(() => {
      return {
        hasClass: document.documentElement.classList.contains('dark'),
        storageValue: localStorage.getItem('admin-theme'),
      };
    });
    
    if (persistedTheme.hasClass && persistedTheme.storageValue === 'dark') {
      log.success('Theme persisted correctly after page reload');
      testResults.passed++;
      testResults.details.push({ test: 'localStorage Persistence', status: 'PASSED' });
      return true;
    } else {
      log.error(`Theme did not persist. Class: ${persistedTheme.hasClass}, Storage: ${persistedTheme.storageValue}`);
      testResults.failed++;
      testResults.details.push({ test: 'localStorage Persistence', status: 'FAILED', reason: 'Theme did not persist' });
      return false;
    }
  } catch (error) {
    log.error(`localStorage persistence test failed: ${error.message}`);
    testResults.failed++;
    testResults.details.push({ test: 'localStorage Persistence', status: 'FAILED', reason: error.message });
    return false;
  }
}

async function testPageDarkModeSupport(page, pagePath) {
  try {
    await page.goto(`http://localhost:3000${pagePath}`, { waitUntil: 'networkidle0' });
    
    // Test in light mode
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
    });
    await page.waitForTimeout(300);
    
    const lightModeElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      let hasLightBg = false;
      let hasLightText = false;
      
      elements.forEach(el => {
        const styles = window.getComputedStyle(el);
        const bgColor = styles.backgroundColor;
        const textColor = styles.color;
        
        // Check for light backgrounds (white, gray-50, etc.)
        if (bgColor.includes('255, 255, 255') || bgColor.includes('249, 250, 251')) {
          hasLightBg = true;
        }
        
        // Check for dark text
        if (textColor.includes('17, 24, 39') || textColor.includes('55, 65, 81')) {
          hasLightText = true;
        }
      });
      
      return { hasLightBg, hasLightText };
    });
    
    // Test in dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await page.waitForTimeout(300);
    
    const darkModeElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      let hasDarkBg = false;
      let hasLightText = false;
      
      elements.forEach(el => {
        const styles = window.getComputedStyle(el);
        const bgColor = styles.backgroundColor;
        const textColor = styles.color;
        
        // Check for dark backgrounds (gray-900, gray-800)
        if (bgColor.includes('17, 24, 39') || bgColor.includes('31, 41, 55')) {
          hasDarkBg = true;
        }
        
        // Check for light text
        if (textColor.includes('243, 244, 246') || textColor.includes('229, 231, 235')) {
          hasLightText = true;
        }
      });
      
      return { hasDarkBg, hasLightText };
    });
    
    const passed = lightModeElements.hasLightBg && darkModeElements.hasDarkBg;
    
    if (passed) {
      log.success(`${pagePath} - Dark mode support verified`);
      testResults.passed++;
      testResults.details.push({ test: `Dark Mode Support: ${pagePath}`, status: 'PASSED' });
    } else {
      log.warning(`${pagePath} - Dark mode support incomplete`);
      testResults.warnings++;
      testResults.details.push({ test: `Dark Mode Support: ${pagePath}`, status: 'WARNING', reason: 'Some elements may not have dark mode styles' });
    }
    
    return passed;
  } catch (error) {
    log.error(`${pagePath} - Test failed: ${error.message}`);
    testResults.failed++;
    testResults.details.push({ test: `Dark Mode Support: ${pagePath}`, status: 'FAILED', reason: error.message });
    return false;
  }
}

async function testColorPaletteConsistency(page) {
  log.section('Testing Color Palette Consistency');
  
  try {
    await page.goto('http://localhost:3000/admin/dashboard', { waitUntil: 'networkidle0' });
    
    const colorUsage = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const colors = {
        purple: 0,
        indigo: 0,
        gray: 0,
        red: 0,
        other: 0,
      };
      
      elements.forEach(el => {
        const classes = el.className;
        if (typeof classes === 'string') {
          if (classes.includes('purple')) colors.purple++;
          if (classes.includes('indigo')) colors.indigo++;
          if (classes.includes('gray')) colors.gray++;
          if (classes.includes('red')) colors.red++;
          if (classes.includes('blue') || classes.includes('green') || classes.includes('yellow') || classes.includes('orange')) {
            colors.other++;
          }
        }
      });
      
      return colors;
    });
    
    log.info(`Color usage: Purple: ${colorUsage.purple}, Indigo: ${colorUsage.indigo}, Gray: ${colorUsage.gray}, Red: ${colorUsage.red}, Other: ${colorUsage.other}`);
    
    if (colorUsage.other === 0) {
      log.success('Color palette is consistent (only purple, indigo, gray, red)');
      testResults.passed++;
      testResults.details.push({ test: 'Color Palette Consistency', status: 'PASSED' });
      return true;
    } else {
      log.warning(`Found ${colorUsage.other} elements with non-standard colors`);
      testResults.warnings++;
      testResults.details.push({ test: 'Color Palette Consistency', status: 'WARNING', reason: `${colorUsage.other} elements with non-standard colors` });
      return false;
    }
  } catch (error) {
    log.error(`Color palette consistency test failed: ${error.message}`);
    testResults.failed++;
    testResults.details.push({ test: 'Color Palette Consistency', status: 'FAILED', reason: error.message });
    return false;
  }
}

async function testAccessibilityContrast(page) {
  log.section('Testing Accessibility Contrast Ratios');
  
  try {
    await page.goto('http://localhost:3000/admin/dashboard', { waitUntil: 'networkidle0' });
    
    // Test in dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await page.waitForTimeout(300);
    
    const contrastIssues = await page.evaluate(() => {
      const issues = [];
      const elements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, button, a');
      
      function getLuminance(r, g, b) {
        const [rs, gs, bs] = [r, g, b].map(c => {
          c = c / 255;
          return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
      }
      
      function getContrastRatio(rgb1, rgb2) {
        const l1 = getLuminance(...rgb1);
        const l2 = getLuminance(...rgb2);
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        return (lighter + 0.05) / (darker + 0.05);
      }
      
      function parseRgb(rgbString) {
        const match = rgbString.match(/\d+/g);
        return match ? match.slice(0, 3).map(Number) : [0, 0, 0];
      }
      
      elements.forEach(el => {
        const styles = window.getComputedStyle(el);
        const textColor = parseRgb(styles.color);
        const bgColor = parseRgb(styles.backgroundColor);
        
        // Skip if background is transparent
        if (bgColor[0] === 0 && bgColor[1] === 0 && bgColor[2] === 0) return;
        
        const ratio = getContrastRatio(textColor, bgColor);
        
        // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
        const fontSize = parseFloat(styles.fontSize);
        const minRatio = fontSize >= 18 || (fontSize >= 14 && styles.fontWeight >= 700) ? 3 : 4.5;
        
        if (ratio < minRatio) {
          issues.push({
            element: el.tagName,
            ratio: ratio.toFixed(2),
            required: minRatio,
          });
        }
      });
      
      return issues;
    });
    
    if (contrastIssues.length === 0) {
      log.success('All text elements meet WCAG AA contrast requirements');
      testResults.passed++;
      testResults.details.push({ test: 'Accessibility Contrast', status: 'PASSED' });
      return true;
    } else {
      log.warning(`Found ${contrastIssues.length} contrast issues`);
      contrastIssues.slice(0, 5).forEach(issue => {
        log.warning(`  ${issue.element}: ${issue.ratio}:1 (required: ${issue.required}:1)`);
      });
      testResults.warnings++;
      testResults.details.push({ test: 'Accessibility Contrast', status: 'WARNING', reason: `${contrastIssues.length} contrast issues found` });
      return false;
    }
  } catch (error) {
    log.error(`Accessibility contrast test failed: ${error.message}`);
    testResults.failed++;
    testResults.details.push({ test: 'Accessibility Contrast', status: 'FAILED', reason: error.message });
    return false;
  }
}

async function generateReport() {
  log.section('Test Summary');
  
  const total = testResults.passed + testResults.failed + testResults.warnings;
  const passRate = total > 0 ? ((testResults.passed / total) * 100).toFixed(1) : 0;
  
  console.log(`\nTotal Tests: ${total}`);
  console.log(`${colors.green}Passed: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${testResults.failed}${colors.reset}`);
  console.log(`${colors.yellow}Warnings: ${testResults.warnings}${colors.reset}`);
  console.log(`Pass Rate: ${passRate}%\n`);
  
  // Generate detailed report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total,
      passed: testResults.passed,
      failed: testResults.failed,
      warnings: testResults.warnings,
      passRate: `${passRate}%`,
    },
    details: testResults.details,
  };
  
  const reportPath = path.join(__dirname, '..', 'dark-mode-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log.success(`Detailed report saved to: ${reportPath}`);
  
  return testResults.failed === 0;
}

async function runTests() {
  let browser, page;
  
  try {
    log.section('Dark Mode Testing Suite');
    log.info('Starting comprehensive dark mode tests...\n');
    
    ({ browser, page } = await setupBrowser());
    
    // Login first
    const loginSuccess = await loginAsAdmin(page);
    if (!loginSuccess) {
      log.error('Cannot proceed without admin login');
      process.exit(1);
    }
    
    // Run tests
    await testThemeToggleButton(page);
    await testThemeToggleFunctionality(page);
    await testLocalStoragePersistence(page);
    
    // Test all admin pages
    log.section('Testing Dark Mode Support Across Pages');
    for (const pagePath of adminPages) {
      await testPageDarkModeSupport(page, pagePath);
    }
    
    await testColorPaletteConsistency(page);
    await testAccessibilityContrast(page);
    
    // Generate report
    const allPassed = await generateReport();
    
    await browser.close();
    
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    log.error(`Test suite failed: ${error.message}`);
    console.error(error);
    
    if (browser) {
      await browser.close();
    }
    
    process.exit(1);
  }
}

// Run tests
runTests();
