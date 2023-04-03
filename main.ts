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

const insertRepo = db.prepareQuery(`INSERT INTO repos (id, data) VALUES (?, ?) ON CONFLICT (id) DO UPDATE SET data = excluded.data`)

const iterator = octokit.paginate.iterator('GET /search/repositories', {
  headers: {
    'X-GitHub-Api-Version': '2022-11-28'
  },
  per_page: 100,
  q: 'stars:>50',
  sort: 'stars',
  order: 'desc'
});

for await (const { data: repos } of iterator) {
  for (const repo of repos) {
    insertRepo.execute([repo.id, JSON.stringify(repo)])
    console.log(`inserted repo ${repo.id} (${repo.name})`)
  }
  await sleep(2)
}

insertRepo.finalize();
db.close();
Deno.exit(0)
