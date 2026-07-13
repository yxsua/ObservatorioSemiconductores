function ProtectedRoute({
  user,
  allowedRoles = [],
  children,
  fallback = null,
  unauthorizedFallback = null,
}) {
  if (!user) {
    return fallback;
  }

  if (allowedRoles.length > 0) {
    const userRoles = user.roles ?? (user.role ? [user.role] : []);
    const canAccess = allowedRoles.some((role) => userRoles.includes(role));

    if (!canAccess) {
      return unauthorizedFallback ?? fallback;
    }
  }

  return children;
}

export default ProtectedRoute;
