import { Octokit } from "https://cdn.skypack.dev/octokit?dts";
import { DB } from "https://deno.land/x/sqlite/mod.ts";
import { sleep } from "https://deno.land/x/sleep/mod.ts";

const octokit = new Octokit({ auth: Deno.env.get("GITHUB_TOKEN") });
const db = new DB("repos.db");

// prepared statement for upserting repos
const insertRepo = db.prepareQuery(`INSERT INTO repos (id, data) VALUES (?, ?) ON CONFLICT (id) DO UPDATE SET data = excluded.data`)

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

const languages = [
  "Python",
  "C",
  "Java",
  "C++",
  "C#",
  "Visual Basic",
  "JavaScript",
  "SQL",
  "PHP",
  "Go",
  "Assembly",
  "R",
  "MATLAB",
  "R",
  "Swift",
  "Ruby",
  "Rust",
  "Fortran",
  "SAS",
  "Ada",
  "Objective-C",
  "Perl",
  "F#",
  "Dart",
  "Lisp",
  "Lua",
  "Julia",
  "Scala",
  "PLSQL",
  "Haskell",
  "TypeScript",
  "D",
  "Kotlin",
  "PowerShell",
  "Shell",
  "Groovy",
  "Zig",
  "Scheme",
  "Prolog",
  "Elixir",
  "HCL",
  "Erlang",
  "Clojure",
  "COBOL",
  "VBA",
  "YAML",
  "CoffeeScript",
]

for await (const language of languages) {
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
      insertRepo.execute([repo.id, JSON.stringify(repo)])
      console.log(`inserted repo ${repo.id} (${repo.owner.login}/${repo.name})`)
    }
    await sleep(2)
  } 
}


insertRepo.finalize();
db.close();
Deno.exit(0)
