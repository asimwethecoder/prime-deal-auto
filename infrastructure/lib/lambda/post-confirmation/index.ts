/**
 * Post-confirmation Lambda trigger stub.
 * Invoked by Cognito after a user confirms their account.
 * Actual DB sync deferred to a later spec when DatabaseStack connection is available.
 */
export async function handler(event: any): Promise<any> {
  console.log('Post-confirmation trigger invoked', JSON.stringify(event));
  // Stub: return event unchanged — actual user sync to Aurora deferred
  return event;
}
