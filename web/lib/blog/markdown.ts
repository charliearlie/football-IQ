import readingTime from "reading-time";

export interface MarkdownSection {
  heading: string | null;
  content: string;
}

/**
 * Splits markdown content on ## headings into sections.
 * The first section (any content before the first ## heading) is treated as
 * an intro with a null heading. Subsequent sections carry their heading text.
 */
export function splitMarkdownSections(markdown: string): MarkdownSection[] {
  const lines = markdown.split("\n");
  const sections: MarkdownSection[] = [];

  let currentHeading: string | null = null;
  let currentLines: string[] = [];

  for (const line of lines) {
    // Match exactly ## headings (not ### or deeper)
    const h2Match = line.match(/^##\s+(.+)$/);

    if (h2Match) {
      // Save the section we were building
      const content = currentLines.join("\n").trim();
      if (content || currentHeading !== null) {
        sections.push({ heading: currentHeading, content });
      }
      // Start a new section
      currentHeading = h2Match[1].trim();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  // Push the final section
  const content = currentLines.join("\n").trim();
  if (content || currentHeading !== null) {
    sections.push({ heading: currentHeading, content });
  }

  // If nothing was parsed, return the whole markdown as a single intro section
  if (sections.length === 0) {
    return [{ heading: null, content: markdown.trim() }];
  }

  return sections;
}

/**
 * Estimates reading time from markdown text.
 * Returns a human-readable string like "5 min read".
 */
export function getReadingTime(text: string): string {
  const stats = readingTime(text);
  return stats.text;
}
