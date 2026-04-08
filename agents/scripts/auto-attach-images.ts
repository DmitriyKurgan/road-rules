/**
 * Auto-attach images to all tickets that don't have images yet.
 *
 * Usage:
 *   npx tsx agents/scripts/auto-attach-images.ts [--api-url URL]
 *
 * Flow:
 *   1. Fetch all published tickets without images
 *   2. For each ticket, search Wikimedia Commons using imageSearchQueries
 *   3. If no results, try fallback queries based on pddRef and tags
 *   4. Attach best candidate
 */

import axios from "axios";

const API_URL = process.argv.includes("--api-url")
  ? process.argv[process.argv.indexOf("--api-url") + 1]
  : "http://localhost:3001/api";

// Fallback search queries based on tags/pddRef
function getFallbackQueries(ticket: any): string[] {
  const queries: string[] = [];
  const ref = ticket.pddRef;
  const tags: string[] = ticket.tags || [];

  // Try UA road sign by pddRef
  queries.push(`UA road sign ${ref} svg`);

  // Tag-based fallbacks
  if (tags.includes("traffic_lights"))
    queries.push("traffic light signal svg Wikimedia");
  if (tags.includes("speed"))
    queries.push(`UA road sign speed limit svg`);
  if (tags.includes("overtaking"))
    queries.push("UA road sign 3.25 no overtaking svg");
  if (tags.includes("parking") || tags.includes("stopping"))
    queries.push("UA road sign no parking stopping svg");
  if (tags.includes("railway_crossing"))
    queries.push("UA road sign railway crossing svg");
  if (tags.includes("pedestrians"))
    queries.push("UA road sign pedestrian crossing svg");
  if (tags.includes("signs"))
    queries.push(`site:commons.wikimedia.org UA road sign svg`);
  if (tags.includes("markings"))
    queries.push("road marking line svg Wikimedia");
  if (tags.includes("intersections"))
    queries.push("intersection road diagram svg Wikimedia");
  if (tags.includes("cyclists"))
    queries.push("UA road sign bicycle cycling svg");
  if (tags.includes("bus_stop"))
    queries.push("UA road sign bus stop svg");
  if (tags.includes("towing"))
    queries.push("car towing diagram svg");
  if (tags.includes("emergency"))
    queries.push("warning triangle hazard sign svg Wikimedia");
  if (tags.includes("documents"))
    queries.push("driver license icon svg Wikimedia");
  if (tags.includes("residential_zone"))
    queries.push("UA road sign 5.31 residential zone");

  return queries;
}

async function login(): Promise<string> {
  const email = process.env.ADMIN_EMAIL || "admin@road-rules.local";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const res = await axios.post(`${API_URL}/auth/login`, { email, password });
  return res.data.accessToken;
}

async function getTicketsWithoutImages(token: string): Promise<any[]> {
  // Fetch all published tickets
  const allTickets: any[] = [];
  let page = 1;
  while (true) {
    const res = await axios.get(
      `${API_URL}/admin/tickets?status=PUBLISHED&pageSize=50&page=${page}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    allTickets.push(...res.data.data);
    if (allTickets.length >= res.data.total) break;
    page++;
  }

  // Filter: only those without images
  const withoutImages: any[] = [];
  for (const t of allTickets) {
    const detail = await axios.get(`${API_URL}/admin/tickets/${t.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!detail.data.images || detail.data.images.length === 0) {
      withoutImages.push(detail.data);
    }
  }

  return withoutImages;
}

async function searchImages(
  token: string,
  query: string,
): Promise<any[]> {
  try {
    const res = await axios.post(
      `${API_URL}/admin/images/resolve`,
      { query },
      { headers: { Authorization: `Bearer ${token}` }, timeout: 20000 },
    );
    return res.data;
  } catch {
    return [];
  }
}

async function attachImage(
  token: string,
  ticketId: string,
  candidate: any,
): Promise<boolean> {
  try {
    await axios.post(
      `${API_URL}/admin/images/attach`,
      {
        ticketId,
        sourceUrl: candidate.fileUrl,
        license: candidate.license,
        author: candidate.author,
        title: candidate.title,
        attributionHtml: candidate.attributionHtml,
      },
      { headers: { Authorization: `Bearer ${token}` }, timeout: 30000 },
    );
    return true;
  } catch (e: any) {
    console.error(`    Attach failed: ${e.message}`);
    return false;
  }
}

async function main() {
  console.log("Logging in...");
  const token = await login();

  console.log("Fetching tickets without images...");
  const tickets = await getTicketsWithoutImages(token);
  console.log(`Found ${tickets.length} tickets without images\n`);

  let attached = 0;
  let failed = 0;

  for (let i = 0; i < tickets.length; i++) {
    const ticket = tickets[i];
    const searchQueries: string[] = [
      ...(ticket.imageSearchQ || []),
      ...getFallbackQueries(ticket),
    ];

    console.log(
      `[${i + 1}/${tickets.length}] ${ticket.pddRef}: ${ticket.questionRu.substring(0, 50)}...`,
    );

    let bestCandidate: any = null;

    for (const query of searchQueries) {
      if (bestCandidate) break;

      const candidates = await searchImages(token, query);
      if (candidates.length > 0) {
        // Prefer exact match by pddRef in title
        bestCandidate =
          candidates.find((c: any) =>
            c.title.toLowerCase().includes(ticket.pddRef),
          ) || candidates[0];
      }

      // Rate limit
      await new Promise((r) => setTimeout(r, 1200));
    }

    if (bestCandidate) {
      const ok = await attachImage(token, ticket.id, bestCandidate);
      if (ok) {
        attached++;
        console.log(`    ✓ ${bestCandidate.title} (${bestCandidate.license})`);
      } else {
        failed++;
      }
    } else {
      failed++;
      console.log(`    ✗ No image found`);
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`Attached: ${attached}`);
  console.log(`Failed/No image: ${failed}`);
  console.log(`Total: ${tickets.length}`);
}

main().catch(console.error);
