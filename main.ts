import { Octokit } from "https://cdn.skypack.dev/octokit?dts";
import { DB } from "https://deno.land/x/sqlite/mod.ts";
import { sleep } from "https://deno.land/x/sleep/mod.ts";

const octokit = new Octokit({ auth: Deno.env.get("GITHUB_TOKEN") });

const db = new DB("repos.db");
db.execute(`
  CREATE TABLE IF NOT EXISTS repos (
    id INTEGER PRIMARY KEY,
    data JSON
  )
`);

const latestRepoID = db.query(`SELECT id FROM repos ORDER BY id DESC LIMIT 1`)[0][0]
const insertRepo = db.prepareQuery(`INSERT INTO repos (id, data) VALUES (?, ?)`)

console.log(`latest repo id: ${latestRepoID}`)

const iterator = octokit.paginate.iterator('GET /repositories', {
  per_page: 100,
  since: latestRepoID
});

for await (const { data: repos } of iterator) {
  for (const repo of repos) {
    insertRepo.execute([repo.id, JSON.stringify(repo)])
    console.log(`inserted repo ${repo.id} (${repo.name})`)
  }
  await sleep(.8)
}

db.close();
Deno.exit(0)
