export type WikiChunk = {
  destination: string;
  section: string;
  text: string;
};

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Match only the city name (ex. not "Houston, US")
function toArticleTitle(destination: string): string {
  return destination.split(',')[0].trim();
}

export async function fetchWikiVoyageSections(destination: string): Promise<WikiChunk[]> {
  const title = toArticleTitle(destination);
  const url =
    `https://en.wikivoyage.org/w/api.php?action=parse&page=${encodeURIComponent(title)}` +
    `&prop=text&format=json&formatversion=2`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'TravelPlanner/1.0 (https://github.com/uma-menon/travel-planner, uma1menon@gmail.com)' },
      next: { revalidate: 86400 }
    });
    if (!res.ok) return [];

    const data = await res.json();
    const html: string = data?.parse?.text;
    if (!html) return [];
    console.log("NOTE: Fetched HTML for", title);

    const chunks: WikiChunk[] = [];
    const SKIP = new Set(['See also', 'References', 'External links']);

    // Split on every <h2 — parts[0] is the lead, parts[1..] each start inside an <h2> tag
    const parts = html.split(/<h2[\s>]/i);

    const leadText = stripHtml(parts[0]);
    if (leadText.length > 100) {
      chunks.push({ destination, section: 'Overview', text: leadText.slice(0, 1500) });
    }

    for (let i = 1; i < parts.length; i++) {
      const h2End = parts[i].indexOf('</h2>');
      if (h2End === -1) continue;
      const section = stripHtml(parts[i].slice(0, h2End));
      if (SKIP.has(section)) continue;
      const text = stripHtml(parts[i].slice(h2End + 5));
      if (text.length > 100) {
        chunks.push({ destination, section, text: text.slice(0, 1500) });
      }
    }

    console.log(`[WikiVoyage] ${title}: ${chunks.length} chunks (${chunks.map(c => c.section).join(', ')})`);
    return chunks;
  } catch {
    return [];
  }
}
