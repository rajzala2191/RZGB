/**
 * Applies workspace scoping to a Supabase query builder.
 * Super admins (workspaceId = null) get unfiltered results.
 * All other users get results filtered to their workspace.
 */
export function applyWorkspaceFilter(query, workspaceId, column = 'workspace_id') {
  if (!workspaceId) return query;
  return query.eq(column, workspaceId);
}

/**
 * Returns the workspace_id to pass into service calls.
 * Super admins pass null to bypass filtering.
 */
export function getEffectiveWorkspaceId(authContext) {
  if (authContext.isSuperAdmin) return null;
  return authContext.workspaceId;
}
