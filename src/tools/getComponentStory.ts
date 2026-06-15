import axios from "axios";

export interface StoryDetails {
  id: string;
  title: string;
  name: string;
  args?: Record<string, unknown>;
  argTypes?: Record<string, unknown>;
  parameters?: Record<string, unknown>;
  importPath?: string;
  tags?: string[];
}

export async function getComponentStory(
  storybookUrl: string,
  storyId: string
): Promise<StoryDetails> {
  const { data } = await axios.get(`${storybookUrl}/index.json`, {
    timeout: 5000,
  });

  const entry = data.entries?.[storyId];
  if (!entry) {
    throw new Error(
      `Story "${storyId}" not found. Use list_components to see available stories.`
    );
  }

  // Attempt to fetch full story data from the stories.json (older Storybook) or index
  let fullDetails: StoryDetails = {
    id: entry.id,
    title: entry.title,
    name: entry.name,
    tags: entry.tags,
    importPath: entry.importPath,
    args: entry.args,
    argTypes: entry.argTypes,
    parameters: entry.parameters,
  };

  // Try fetching additional details from the Storybook API endpoint
  try {
    const { data: storyData } = await axios.get(
      `${storybookUrl}/stories.json`,
      { timeout: 3000 }
    );
    const fullEntry = storyData?.stories?.[storyId];
    if (fullEntry) {
      fullDetails = { ...fullDetails, ...fullEntry };
    }
  } catch {
    // stories.json is optional — index.json data is sufficient
  }

  return fullDetails;
}
