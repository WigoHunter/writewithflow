-- Allow anyone to read writing stats (for public profile heatmaps)
-- Note: The existing policy still applies for INSERT/UPDATE/DELETE operations

create policy "Anyone can read writing stats" on daily_writing_stats
  for select using (true);
