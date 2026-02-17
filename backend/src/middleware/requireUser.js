/**
 * Require that the authenticated user has role 'user' (not admin).
 * Use for project, brand profile, social connection routes.
 */
export const requireUser = (req, res, next) => {
  if (req.user?.role !== 'user') {
    return res.status(403).json({
      success: false,
      message: 'This endpoint is only available for regular users',
    });
  }
  next();
};
