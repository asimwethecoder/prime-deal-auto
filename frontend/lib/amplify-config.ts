/**
 * Amplify Auth configuration for Cognito
 * Set NEXT_PUBLIC_COGNITO_USER_POOL_ID and NEXT_PUBLIC_COGNITO_CLIENT_ID in .env.local
 */
const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
const userPoolClientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;

export const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: userPoolId ?? '',
      userPoolClientId: userPoolClientId ?? '',
      loginWith: {
        email: true,
        username: false,
        phone: false,
      },
      signUpVerificationMethod: 'code' as const,
      userAttributes: {
        email: { required: true },
      },
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: true,
      },
    },
  },
};

export function isAmplifyConfigured(): boolean {
  return Boolean(userPoolId && userPoolClientId);
}
