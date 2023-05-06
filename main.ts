import { Octokit } from "https://cdn.skypack.dev/octokit?dts";
import { DB } from "https://deno.land/x/sqlite/mod.ts";
import { sleep } from "https://deno.land/x/sleep/mod.ts";

const octokit = new Octokit({ auth: Deno.env.get("GITHUB_TOKEN") });
const db = new DB("repos.db");

const MAX_REPOS_PER_LANGUAGE = 500;

Deno.addSignalListener("SIGINT", () => {
  insertRepo.finalize();
  db.close();
  Deno.exit(1);
});

// initialize a repos table
db.execute(`
  CREATE TABLE IF NOT EXISTS repos (
    id INTEGER PRIMARY KEY,
    data JSON
  )
`);

// prepared statement for upserting repos
const insertRepo = db.prepareQuery(`INSERT INTO repos (id, data) VALUES (?, ?) ON CONFLICT (id) DO UPDATE SET data = excluded.data`)

const languages = [
  "Python",
  "C",
  "Java",
  "C++",
  "C#",
  "JavaScript",
  "PHP",
  "Go",
  "Swift",
  "Ruby",
  "Rust",
  "Objective-C",
  "Perl",
  "Lisp",
  "Scala",
  "Haskell",
  "TypeScript",
  "Kotlin",
  "Zig",
  "Elixir",
  "Erlang",
]

for await (const language of languages) {
  let repoCount = 0
  const iterator = octokit.paginate.iterator('GET /search/repositories', {
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    },
    per_page: 100,
    q: `stars:>50 language:${language}`,
    sort: 'stars',
    order: 'desc'
  });
  
  for await (const { data: repos } of iterator) {
    for (const repo of repos) {
      repoCount++
      if (repoCount > MAX_REPOS_PER_LANGUAGE) {
        break
      }
      
      insertRepo.execute([repo.id, JSON.stringify(repo)])
      console.log(`inserted repo ${repo.id} (${repo.owner.login}/${repo.name})`)
    }
    await sleep(2)
  } 
}


insertRepo.finalize();
db.close();
Deno.exit(0)
