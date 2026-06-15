import axios from "axios";

interface IndexEntry {
  id: string;
  title: string;
  name: string;
  tags?: string[];
  parameters?: { docs?: { description?: string } };
}

function score(entry: IndexEntry, query: string): number {
  const q = query.toLowerCase();
  const tokens = q.split(/\s+/);
  let s = 0;

  for (const token of tokens) {
    if (entry.id.toLowerCase().includes(token)) s += 3;
    if (entry.title.toLowerCase().includes(token)) s += 5;
    if (entry.name.toLowerCase().includes(token)) s += 4;
    if (entry.tags?.some((t) => t.toLowerCase().includes(token))) s += 2;
    if (
      entry.parameters?.docs?.description?.toLowerCase().includes(token)
    )
      s += 1;
  }

  return s;
}

export async function searchComponents(
  storybookUrl: string,
  query: string,
  limit: number
): Promise<{ query: string; results: IndexEntry[] }> {
  const { data } = await axios.get(`${storybookUrl}/index.json`, {
    timeout: 5000,
  });

  const entries = Object.values(data.entries) as IndexEntry[];

  const scored = entries
    .map((e) => ({ entry: e, score: score(e, query) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.entry);

  return { query, results: scored };
}
