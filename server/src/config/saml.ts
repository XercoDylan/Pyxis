/**
 * Passport SAML strategy configuration for MIT Touchstone authentication.
 *
 * In development mode, if no SAML_CERT is configured, the SAML strategy
 * is not registered and auth routes will return a helpful error.
 */

import passport from 'passport';
import { config } from './index.js';

export interface SamlProfile {
  kerberos: string;
  name: string;
  email: string;
}

/**
 * Serialize user to session (stores minimal identifier).
 */
passport.serializeUser((user: Express.User, done) => {
  done(null, user);
});

/**
 * Deserialize user from session.
 */
passport.deserializeUser((user: Express.User, done) => {
  done(null, user);
});

// Only register the SAML strategy if a cert is provided.
// This allows the server to start in local dev without Touchstone credentials.
if (config.saml.cert) {
  import('passport-saml').then(({ Strategy: SamlStrategy }) => {
    const samlStrategy = new SamlStrategy(
      {
        entryPoint: config.saml.entryPoint,
        issuer: config.saml.issuer,
        callbackUrl: config.saml.callbackUrl,
        cert: config.saml.cert,
        identifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified',
        wantAssertionsSigned: true,
        disableRequestedAuthnContext: true,
      },
      (profile: Record<string, unknown> | null | undefined, done: any) => {
        if (!profile) {
          return done(new Error('No SAML profile received'), undefined);
        }

        const samlProfile: SamlProfile = {
          kerberos: (profile['uid'] as string) || (profile['urn:oid:0.9.2342.19200300.100.1.1'] as string) || '',
          name: (profile['displayName'] as string) || (profile['urn:oid:2.16.840.1.113730.3.1.241'] as string) || '',
          email: (profile['mail'] as string) || (profile['urn:oid:0.9.2342.19200300.100.1.3'] as string) || '',
        };

        if (!samlProfile.kerberos) {
          return done(new Error('Kerberos identifier not found in SAML attributes'), undefined);
        }

        return done(null, samlProfile as unknown as Record<string, unknown>);
      }
    );

    passport.use('saml', samlStrategy);
    console.log('[SAML] Touchstone strategy registered');
  });
} else {
  console.warn('[SAML] No SAML_CERT configured — Touchstone auth disabled (dev mode)');
}

export { passport };
export default passport;
