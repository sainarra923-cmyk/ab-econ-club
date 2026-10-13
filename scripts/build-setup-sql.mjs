// Builds supabase/setup.sql = schema.sql + placeholder content.
// Run with: node scripts/build-setup-sql.mjs
import { readFileSync, writeFileSync } from "node:fs";

const root = new URL("..", import.meta.url);
const schema = readFileSync(new URL("supabase/schema.sql", root), "utf8");
const content = JSON.parse(readFileSync(new URL("src/content/placeholder.json", root), "utf8"));

const q = (v) => (v === null || v === undefined ? "null" : `'${String(v).replace(/'/g, "''")}'`);
const arr = (a) => `array[${a.map(q).join(", ")}]::text[]`;

let seed = `
-- ============================================================
-- Placeholder content (only added if the tables are empty).
-- Delete it any time from the admin area.
-- ============================================================

do $$
begin
  if not exists (select 1 from public.profiles where user_id is null) and not exists (select 1 from public.posts) then
`;

for (const o of content.officers) {
  seed += `    insert into public.profiles (name, slug, title, grade, bio, sort_order) values (${q(o.name)}, ${q(o.slug)}, ${q(o.title)}, ${q(o.grade)}, ${q(o.bio)}, ${o.sort_order});\n`;
}

for (const p of content.posts) {
  seed += `    insert into public.posts (slug, title, excerpt, body, tags, status, published_at, author_id) values (${q(p.slug)}, ${q(p.title)}, ${q(p.excerpt)}, ${q(p.body)}, ${arr(p.tags)}, 'published', now() - interval '${p.days_ago} days', (select id from public.profiles where slug = ${q(p.author)}));\n`;
}

for (const e of content.events) {
  const start = `((date_trunc('day', now() at time zone 'America/New_York') + interval '${e.day_offset} days' + time ${q(e.start_time)}) at time zone 'America/New_York')`;
  seed += `    insert into public.events (title, description, location, starts_at, ends_at) values (${q(e.title)}, ${q(e.description)}, ${q(e.location)}, ${start}, ${start} + interval '${e.duration_minutes} minutes');\n`;
}

seed += `  end if;
end;
$$;
`;

writeFileSync(
  new URL("supabase/setup.sql", root),
  `-- GENERATED FILE. Paste this whole file into Supabase > SQL Editor and click Run.\n-- To change it, edit supabase/schema.sql or src/content/placeholder.json and run: node scripts/build-setup-sql.mjs\n\n` +
    schema +
    seed,
);
console.log("Wrote supabase/setup.sql");
