'use client';

import { Amplify } from 'aws-amplify';

const userPoolId = process.env.NEXT_PUBLIC_USER_POOL_ID;
const userPoolClientId = process.env.NEXT_PUBLIC_CLIENT_ID;
const identityPoolId = process.env.NEXT_PUBLIC_IDENTITY_POOL_ID;
const oauthDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
const redirectSignIn = process.env.NEXT_PUBLIC_COGNITO_REDIRECT_SIGN_IN;
const redirectSignOut = process.env.NEXT_PUBLIC_COGNITO_REDIRECT_SIGN_OUT;
const oauthScopes = process.env.NEXT_PUBLIC_COGNITO_SCOPES;
const responseType = process.env.NEXT_PUBLIC_COGNITO_RESPONSE_TYPE || 'code';

const loginWith = oauthDomain && redirectSignIn && redirectSignOut
  ? {
      oauth: {
        domain: oauthDomain,
        scopes: oauthScopes
          ? oauthScopes.split(',').map((scope) => scope.trim())
          : ['email', 'openid', 'profile'],
        redirectSignIn,
        redirectSignOut,
        responseType,
      },
    }
  : undefined;

const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId,
      userPoolClientId,
      identityPoolId,
      ...(loginWith ? { loginWith } : {}),
    },
  },
};

if (!userPoolId || !userPoolClientId) {
  console.warn('Amplify Cognito configuration is missing userPoolId or userPoolClientId.');
}

Amplify.configure(amplifyConfig);

export default amplifyConfig;
