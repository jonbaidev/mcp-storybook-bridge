import axios from "axios";

export interface StorybookStory {
  id: string;
  title: string;
  name: string;
  kind: string;
  tags?: string[];
}

export interface StorybookIndex {
  v: number;
  entries: Record<string, StorybookStory>;
}

export async function listComponents(
  storybookUrl: string,
  filter?: string
): Promise<{ total: number; components: StorybookStory[] }> {
  const { data } = await axios.get<StorybookIndex>(
    `${storybookUrl}/index.json`,
    { timeout: 5000 }
  );

  let entries = Object.values(data.entries).filter(
    (e) => e.id && e.title && e.name
  );

  if (filter) {
    const q = filter.toLowerCase();
    entries = entries.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.name.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q) ||
        e.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }

  return { total: entries.length, components: entries };
}
