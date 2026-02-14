/**
 * Protects the /setup route. Only allows access when ALLOW_ADMIN_SETUP=true.
 * Set this env var when creating your first admin, then remove or set to false.
 */
export const allowSetupOnlyWhenEnabled = (req, res, next) => {
  if (process.env.ALLOW_ADMIN_SETUP === 'true') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Admin setup is disabled. Set ALLOW_ADMIN_SETUP=true to create the first admin.',
  });
};
