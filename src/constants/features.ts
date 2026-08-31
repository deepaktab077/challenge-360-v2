// Toggle built features on/off without ripping out the underlying code.
// Flip these back to `true` to re-enable for users at any time.

/** Teams, team leaderboard, and team assignment UI. The backend (tables,
 * RLS, admin team management) stays fully intact — this only hides it from
 * regular participants and the leaderboard/signup UI. */
export const TEAMS_ENABLED = false;
