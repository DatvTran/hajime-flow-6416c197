/**
 * Daily expo follow-up digest. Run as a separate Railway cron:
 *   node server/jobs/lead-digest.mjs
 * Must exit (close the Knex pool) so the container does not hang.
 */
import { platformDb } from "../config/database.mjs";

const sql = `
  select l.display_id, l.full_name, l.company_name, l.status, l.next_action, l.follow_up_on, u.email as owner_email
  from expo_leads l
  left join users u on u.id = l.staff_user_id
  where l.status not in ('converted', 'closed')
    and (
      l.staff_user_id is null
      or (l.follow_up_on is not null and l.follow_up_on < current_date)
    )
  order by l.follow_up_on nulls first
  limit 500
`;

try {
  if (await platformDb.schema.hasTable("expo_leads")) {
    const rows = await platformDb.raw(sql);
    const list = rows.rows || rows || [];
    console.log(`[lead-digest] ${list.length} overdue or unassigned expo leads`);
    for (const row of list.slice(0, 50)) {
      console.log(`  ${row.display_id} ${row.company_name} ${row.status} ${row.owner_email || "unowned"}`);
    }
  } else {
    console.log("[lead-digest] expo_leads not present");
  }
} catch (e) {
  console.error("[lead-digest]", e);
  process.exitCode = 1;
} finally {
  await platformDb.destroy();
}
