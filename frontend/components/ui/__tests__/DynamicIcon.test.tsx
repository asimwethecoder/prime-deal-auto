/**
 * DynamicIcon Tests
 *
 * This file contains two types of tests:
 *
 * 1. Bug Condition Exploration Tests (Property 1)
 *    - Validates: Requirements 1.1, 1.2, 2.1, 2.2, 2.3
 *    - Tests that Lucide icons resolve synchronously without network requests
 *    - EXPECTED on UNFIXED code: FAIL (confirms bug exists)
 *    - EXPECTED on FIXED code: PASS
 *
 * 2. Preservation Property Tests (Property 2)
 *    - Validates: Requirements 3.1, 3.2, 3.3, 3.4
 *    - Tests that custom SVG loading behavior is unchanged
 *    - Tests that fallback placeholder behavior is unchanged
 *    - Tests that props are applied correctly
 *    - EXPECTED on UNFIXED code: PASS (confirms baseline behavior)
 *    - EXPECTED on FIXED code: PASS (confirms no regressions)
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import fc from 'fast-check';
import { DynamicIcon, clearSvgExistsCache } from '../DynamicIcon';

// Known custom SVG icons that exist in /public/icons/
const CUSTOM_SVG_ICONS = [
  'audi-svgrepo-com',
  'bmw-svgrepo-com',
  'toyota-svgrepo-com',
  'mercedes-svgrepo-com',
  'ford-svgrepo-com',
  'honda-svgrepo-com',
  'volkswagen-svgrepo-com',
  'hyundai-svgrepo-com',
  'kia-svgrepo-com',
  'facebook-svgrepo-com',
  'instagram-svgrepo-com',
  'twitter-svgrepo-com',
  'whatsapp-svgrepo-com',
];

// Track all fetch calls to detect HEAD requests
let fetchCalls: { url: string; method: string }[] = [];
const originalFetch = global.fetch;


/**
 * Property 1: Bug Condition - Lucide Icons Make Unnecessary Network Requests
 *
 * Scoped PBT Approach: Testing concrete Lucide icon names that trigger the bug
 * 
 * Mock Setup: Returns 404 for ALL SVGs (simulates Lucide icons not existing as custom SVGs)
 */
describe('DynamicIcon Bug Condition Exploration', () => {
  beforeEach(() => {
    fetchCalls = [];
    // Clear the SVG existence cache to ensure test isolation
    clearSvgExistsCache();
    // Mock returns 404 for all SVGs - Lucide icons don't exist as custom SVGs
    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      const method = init?.method || 'GET';
      fetchCalls.push({ url, method });

      if (url.includes('/icons/') && url.endsWith('.svg')) {
        return new Response(null, { status: 404, statusText: 'Not Found' });
      }
      return originalFetch(input, init);
    }) as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  /**
   * Test Case 1: Lucide icon "check" should NOT make HEAD request
   */
  it('should NOT make a HEAD request to /icons/check.svg for Lucide icon "check"', async () => {
    render(<DynamicIcon name="check" />);

    await waitFor(
      () => {
        const headRequestToCheckSvg = fetchCalls.find(
          (call) => call.method === 'HEAD' && call.url.includes('/icons/check.svg')
        );
        // EXPECTED: No HEAD request for Lucide icons
        // BUG: HEAD request IS made, causing 404 error
        expect(headRequestToCheckSvg).toBeUndefined();
      },
      { timeout: 1000 }
    );
  });

  /**
   * Test Case 2: Lucide icon "check" should NOT show loading state
   */
  it('should NOT show a loading state before rendering Lucide icon "check"', () => {
    const { container } = render(<DynamicIcon name="check" />);
    const loadingPlaceholder = container.querySelector('.animate-pulse');
    // EXPECTED: No loading placeholder for Lucide icons
    // BUG: Loading placeholder IS shown
    expect(loadingPlaceholder).toBeNull();
  });

  /**
   * Test Case 3: Lucide icon "check" should render immediately
   */
  it('should render Lucide Check icon immediately for name="check"', () => {
    const { container } = render(<DynamicIcon name="check" />);
    const svgElement = container.querySelector('svg');
    // EXPECTED: SVG element present immediately
    // BUG: SVG element NOT present on first render
    expect(svgElement).toBeInTheDocument();
  });

  /**
   * Test Case 4: Lucide icon "arrow-left" should NOT make HEAD request
   */
  it('should NOT make a HEAD request to /icons/arrow-left.svg for Lucide icon "arrow-left"', async () => {
    render(<DynamicIcon name="arrow-left" />);

    await waitFor(
      () => {
        const headRequest = fetchCalls.find(
          (call) => call.method === 'HEAD' && call.url.includes('/icons/arrow-left.svg')
        );
        expect(headRequest).toBeUndefined();
      },
      { timeout: 1000 }
    );
  });

  /**
   * Test Case 5: Lucide icon "x" should render immediately without loading
   */
  it('should render Lucide X icon immediately without loading state for name="x"', () => {
    const { container } = render(<DynamicIcon name="x" />);
    expect(container.querySelector('.animate-pulse')).toBeNull();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  /**
   * Test Case 6: Multiple Lucide icons should not make duplicate requests
   */
  it('should NOT make any HEAD requests when rendering multiple Lucide icons', async () => {
    render(
      <>
        <DynamicIcon name="check" />
        <DynamicIcon name="check" />
        <DynamicIcon name="arrow-left" />
      </>
    );

    await waitFor(
      () => {
        const headRequests = fetchCalls.filter(
          (call) => call.method === 'HEAD' && call.url.includes('/icons/')
        );
        // EXPECTED: Zero HEAD requests for Lucide icons
        // BUG: Multiple HEAD requests made
        expect(headRequests).toHaveLength(0);
      },
      { timeout: 1000 }
    );
  });
});


/**
 * Property 2: Preservation - Custom SVG Loading Behavior Unchanged
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
 *
 * Mock Setup: Returns 200 for known custom SVGs, 404 for everything else
 * This simulates the real behavior where custom SVGs exist in /public/icons/
 *
 * EXPECTED OUTCOME on UNFIXED code: Tests PASS (confirms baseline behavior)
 * EXPECTED OUTCOME on FIXED code: Tests PASS (confirms no regressions)
 */
describe('DynamicIcon Preservation Property Tests', () => {
  // Icons that don't exist in Lucide OR as custom SVGs (should show fallback)
  const NONEXISTENT_ICONS = [
    'nonexistent-icon',
    'fake-brand-logo',
    'random-gibberish-xyz',
    'not-a-real-icon-123',
  ];

  beforeEach(() => {
    fetchCalls = [];
    // Clear the SVG existence cache to ensure test isolation
    clearSvgExistsCache();
    // Mock returns 200 for known custom SVGs, 404 for others
    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      const method = init?.method || 'GET';
      fetchCalls.push({ url, method });

      if (url.includes('/icons/') && url.endsWith('.svg')) {
        // Check if this is a known custom SVG
        const iconName = url.split('/icons/')[1]?.replace('.svg', '');
        if (iconName && CUSTOM_SVG_ICONS.includes(iconName)) {
          return new Response(null, { status: 200, statusText: 'OK' });
        }
        return new Response(null, { status: 404, statusText: 'Not Found' });
      }
      return originalFetch(input, init);
    }) as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  /**
   * Test Case 1: Custom SVG icons load correctly
   * Preservation: Custom SVG icons (brand logos) must continue to load from /public/icons/
   * Validates: Requirement 3.1
   */
  describe('Custom SVG Loading Preservation', () => {
    it('should load custom SVG icon "audi-svgrepo-com" from /public/icons/', async () => {
      const { container } = render(<DynamicIcon name="audi-svgrepo-com" />);

      await waitFor(
        () => {
          const imgElement = container.querySelector('img');
          expect(imgElement).toBeInTheDocument();
          expect(imgElement?.getAttribute('src')).toContain('/icons/audi-svgrepo-com.svg');
        },
        { timeout: 2000 }
      );
    });

    it('should load custom SVG icon "bmw-svgrepo-com" from /public/icons/', async () => {
      const { container } = render(<DynamicIcon name="bmw-svgrepo-com" />);

      await waitFor(
        () => {
          const imgElement = container.querySelector('img');
          expect(imgElement).toBeInTheDocument();
          expect(imgElement?.getAttribute('src')).toContain('/icons/bmw-svgrepo-com.svg');
        },
        { timeout: 2000 }
      );
    });

    /**
     * Property-based test: For all custom SVG icon names, the component loads the SVG
     */
    it('should load any custom SVG icon from /public/icons/', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...CUSTOM_SVG_ICONS),
          async (iconName) => {
            const { container, unmount } = render(<DynamicIcon name={iconName} />);

            await waitFor(
              () => {
                const imgElement = container.querySelector('img');
                expect(imgElement).toBeInTheDocument();
                expect(imgElement?.getAttribute('src')).toContain(`/icons/${iconName}.svg`);
              },
              { timeout: 2000 }
            );

            unmount();
          }
        ),
        { numRuns: CUSTOM_SVG_ICONS.length }
      );
    });
  });


  /**
   * Test Case 2: Fallback placeholder shows for unknown icons
   * Preservation: Icons not in Lucide or custom SVGs must show "?" placeholder
   * Validates: Requirement 3.2
   */
  describe('Fallback Placeholder Preservation', () => {
    it('should show "?" placeholder for icon "nonexistent" that does not exist', async () => {
      const { container } = render(<DynamicIcon name="nonexistent" />);

      await waitFor(
        () => {
          expect(container.querySelector('img')).not.toBeInTheDocument();
          expect(container.querySelector('svg')).not.toBeInTheDocument();
          const placeholder = container.querySelector('div');
          expect(placeholder).toBeInTheDocument();
          expect(placeholder?.textContent).toBe('?');
        },
        { timeout: 2000 }
      );
    });

    /**
     * Property-based test: For all nonexistent icon names, the component shows fallback
     */
    it('should show fallback placeholder for any nonexistent icon', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...NONEXISTENT_ICONS),
          async (iconName) => {
            const { container, unmount } = render(<DynamicIcon name={iconName} />);

            await waitFor(
              () => {
                expect(container.querySelector('img')).not.toBeInTheDocument();
                expect(container.querySelector('svg')).not.toBeInTheDocument();
                const placeholder = container.querySelector('div');
                expect(placeholder).toBeInTheDocument();
                expect(placeholder?.textContent).toBe('?');
              },
              { timeout: 2000 }
            );

            unmount();
          }
        ),
        { numRuns: NONEXISTENT_ICONS.length }
      );
    });

    /**
     * Property-based test: Random strings that don't match Lucide or custom SVGs show fallback
     */
    it('should show fallback for randomly generated non-matching icon names', async () => {
      const randomNonMatchingName = fc
        .array(fc.constantFrom('q', 'w', 'z', '1', '2', '3', '-'), { minLength: 10, maxLength: 20 })
        .map((chars) => chars.join(''))
        .filter((s) => s.length >= 10 && !s.startsWith('-') && !s.endsWith('-'));

      await fc.assert(
        fc.asyncProperty(randomNonMatchingName, async (iconName) => {
          const { container, unmount } = render(<DynamicIcon name={iconName} />);

          await waitFor(
            () => {
              expect(container.querySelector('img')).not.toBeInTheDocument();
              const svgElement = container.querySelector('svg');
              const placeholder = container.querySelector('div');
              expect(svgElement || placeholder).toBeTruthy();
              if (!svgElement) {
                expect(placeholder?.textContent).toBe('?');
              }
            },
            { timeout: 2000 }
          );

          unmount();
        }),
        { numRuns: 10 }
      );
    });
  });


  /**
   * Test Case 3: Props are applied correctly
   * Preservation: width, height, className, aria-hidden props must work correctly
   * Validates: Requirements 3.3, 3.4
   */
  describe('Props Application Preservation', () => {
    it('should apply width and height props to custom SVG icons', async () => {
      const { container } = render(
        <DynamicIcon name="audi-svgrepo-com" width={48} height={48} />
      );

      await waitFor(
        () => {
          const imgElement = container.querySelector('img');
          expect(imgElement).toBeInTheDocument();
          expect(imgElement?.getAttribute('width')).toBe('48');
          expect(imgElement?.getAttribute('height')).toBe('48');
        },
        { timeout: 2000 }
      );
    });

    it('should apply className prop to custom SVG icons', async () => {
      const { container } = render(
        <DynamicIcon name="bmw-svgrepo-com" className="test-class custom-icon" />
      );

      await waitFor(
        () => {
          const imgElement = container.querySelector('img');
          expect(imgElement).toBeInTheDocument();
          expect(imgElement?.className).toContain('test-class');
          expect(imgElement?.className).toContain('custom-icon');
        },
        { timeout: 2000 }
      );
    });

    it('should apply aria-hidden prop to custom SVG icons', async () => {
      const { container } = render(
        <DynamicIcon name="toyota-svgrepo-com" aria-hidden={true} />
      );

      await waitFor(
        () => {
          const imgElement = container.querySelector('img');
          expect(imgElement).toBeInTheDocument();
          expect(imgElement?.getAttribute('aria-hidden')).toBe('true');
        },
        { timeout: 2000 }
      );
    });

    it('should apply width and height props to fallback placeholder', async () => {
      const { container } = render(
        <DynamicIcon name="nonexistent-icon-xyz" width={32} height={32} />
      );

      await waitFor(
        () => {
          const placeholder = container.querySelector('div');
          expect(placeholder).toBeInTheDocument();
          expect(placeholder?.style.width).toBe('32px');
          expect(placeholder?.style.height).toBe('32px');
        },
        { timeout: 2000 }
      );
    });

    it('should apply className prop to fallback placeholder', async () => {
      const { container } = render(
        <DynamicIcon name="nonexistent-icon-abc" className="fallback-class" />
      );

      await waitFor(
        () => {
          const placeholder = container.querySelector('div');
          expect(placeholder).toBeInTheDocument();
          expect(placeholder?.className).toContain('fallback-class');
        },
        { timeout: 2000 }
      );
    });

    it('should apply aria-hidden prop to fallback placeholder', async () => {
      const { container } = render(
        <DynamicIcon name="nonexistent-icon-def" aria-hidden={true} />
      );

      await waitFor(
        () => {
          const placeholder = container.querySelector('div');
          expect(placeholder).toBeInTheDocument();
          expect(placeholder?.getAttribute('aria-hidden')).toBe('true');
        },
        { timeout: 2000 }
      );
    });


    /**
     * Property-based test: Props are applied correctly to any custom SVG icon
     */
    it('should apply all props correctly to any custom SVG icon', async () => {
      const propsArbitrary = fc.record({
        iconName: fc.constantFrom(...CUSTOM_SVG_ICONS),
        width: fc.integer({ min: 16, max: 128 }),
        height: fc.integer({ min: 16, max: 128 }),
        className: fc.array(fc.constantFrom('a', 'b', 'c'), { minLength: 3, maxLength: 10 }).map((c) => c.join('')),
        ariaHidden: fc.boolean(),
      });

      await fc.assert(
        fc.asyncProperty(propsArbitrary, async ({ iconName, width, height, className, ariaHidden }) => {
          const { container, unmount } = render(
            <DynamicIcon
              name={iconName}
              width={width}
              height={height}
              className={className}
              aria-hidden={ariaHidden}
            />
          );

          await waitFor(
            () => {
              const imgElement = container.querySelector('img');
              expect(imgElement).toBeInTheDocument();
              expect(imgElement?.getAttribute('width')).toBe(String(width));
              expect(imgElement?.getAttribute('height')).toBe(String(height));
              expect(imgElement?.className).toContain(className);
              expect(imgElement?.getAttribute('aria-hidden')).toBe(String(ariaHidden));
            },
            { timeout: 2000 }
          );

          unmount();
        }),
        { numRuns: 10 }
      );
    }, 30000); // Increase timeout for PBT
  });

  /**
   * Test Case 4: Loading state shows for custom SVG checks
   * Preservation: Loading state should show while checking for custom SVGs
   * This is expected behavior for non-Lucide icons (async check required)
   */
  describe('Loading State Preservation for Custom SVGs', () => {
    it('should show loading state initially when checking for custom SVG', () => {
      const { container } = render(<DynamicIcon name="audi-svgrepo-com" />);
      const loadingPlaceholder = container.querySelector('.animate-pulse');
      expect(loadingPlaceholder).toBeInTheDocument();
    });

    it('should transition from loading to rendered SVG for custom icons', async () => {
      const { container } = render(<DynamicIcon name="bmw-svgrepo-com" />);

      // Initially should have loading state
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();

      // After async check, should have img element
      await waitFor(
        () => {
          expect(container.querySelector('.animate-pulse')).not.toBeInTheDocument();
          expect(container.querySelector('img')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });
  });
});
