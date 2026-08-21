/**
 * Auth0 Action — Post Login trigger.
 * Denies access if the user hasn't verified their email address yet,
 * so an unverified user never receives a session/tokens from Auth0.
 */
exports.onExecutePostLogin = async (event, api) => {
  // Some connections (e.g. verified social providers) never set this to false.
  if (event.user.email_verified === false) {
    api.access.deny(
      'email_not_verified',
      'Please verify your email address before logging in. Check your inbox for the verification link.',
    );
  }
};
