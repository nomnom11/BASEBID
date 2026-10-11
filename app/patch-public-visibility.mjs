import { readFileSync, writeFileSync } from "node:fs";

const path = "src/lib/launchpad/queries.ts";
let s = readFileSync(path, "utf8");

const patches = [
  [
    'const rows = await db<Raw[]>`${db.unsafe(SELECT)} WHERE l.chain_id = ${chainIdOf(chain)} AND l.token = ${token.toLowerCase()}`;',
    'const rows = await db<Raw[]>`${db.unsafe(SELECT)} WHERE l.chain_id = ${chainIdOf(chain)} AND l.token = ${token.toLowerCase()}${LAUNCH_VISIBLE_FROM ? db` AND l.block_time >= ${LAUNCH_VISIBLE_FROM.toISOString()}::timestamptz` : db``}`;'
  ],
  [
    'WHERE ${matches.reduce((a, b) => db`${a} OR ${b}`)}',
    'WHERE (${matches.reduce((a, b) => db`${a} OR ${b}`)})${LAUNCH_VISIBLE_FROM ? db` AND l.block_time >= ${LAUNCH_VISIBLE_FROM.toISOString()}::timestamptz` : db``}'
  ],
  [
    'SELECT chain_id FROM bb_launches WHERE token = ${token.toLowerCase()} ORDER BY block_time DESC, chain_id DESC, block_number DESC LIMIT 1',
    'SELECT chain_id FROM bb_launches WHERE token = ${token.toLowerCase()}${LAUNCH_VISIBLE_FROM ? db` AND block_time >= ${LAUNCH_VISIBLE_FROM.toISOString()}::timestamptz` : db``} ORDER BY block_time DESC, chain_id DESC, block_number DESC LIMIT 1'
  ]
];

for (const [oldText] of patches) {
  const count = s.split(oldText).length - 1;
  if (count !== 1) {
    console.error(`STOP: pola ditemukan ${count} kali; file tidak diubah.`);
    console.error(oldText.slice(0, 100));
    process.exit(1);
  }
}

for (const [oldText, newText] of patches) {
  s = s.replace(oldText, newText);
}

writeFileSync(path, s);
console.log("OK: ketiga jalur publik sudah dibatasi.");
