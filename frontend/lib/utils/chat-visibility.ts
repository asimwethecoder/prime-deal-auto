// Chat Widget Route Visibility
// Determines which routes should show the chat widget

/**
 * Routes where the chat widget should NOT be displayed
 */
const EXCLUDED_ROUTE_PREFIXES = ['/admin', '/dashboard'];

/**
 * Check if chat widget should be visible on the given pathname
 */
export function isChatVisibleOnRoute(pathname: string): boolean {
  return !EXCLUDED_ROUTE_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
}
