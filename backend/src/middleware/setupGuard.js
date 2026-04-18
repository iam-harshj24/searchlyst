/**
 * Protects the /setup route. Only allows access when ALLOW_ADMIN_SETUP=true.
 * Set this env var when creating your first admin, then remove or set to false.
 */
export const allowSetupOnlyWhenEnabled = (req, res, next) => {
  const isEnabled = process.env.ALLOW_ADMIN_SETUP === 'true';
  const setupToken = process.env.SETUP_TOKEN;

  if (isEnabled) {
    // If a token is configured, require it in headers
    if (setupToken && req.headers['x-setup-token'] !== setupToken) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or missing setup token',
      });
    }
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Admin setup is disabled. Set ALLOW_ADMIN_SETUP=true to create the first admin.',
  });
};
