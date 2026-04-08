/**
 * Image Search Script
 *
 * Reads tickets from a JSONL file and searches Wikimedia Commons
 * for matching images, outputting resolved candidates.
 *
 * Usage:
 *   npx tsx agents/scripts/search-images.ts [input] [output]
 *
 * Defaults:
 *   input:  agents/data/tickets.generated.jsonl
 *   output: agents/data/images.resolved.jsonl
 */

import axios from "axios";
import * as fs from "fs";
import * as path from "path";

const ALLOWED_LICENSES = [
  "cc0",
  "cc-zero",
  "public domain",
  "pd",
  "cc-by",
  "cc-by-sa",
  "cc-by-4.0",
  "cc-by-sa-4.0",
  "cc-by-3.0",
  "cc-by-sa-3.0",
];

const USER_AGENT =
  "RoadRulesTrainer/1.0 (https://github.com/road-rules; admin@road-rules.local)";

interface ImageCandidate {
  pageUrl: string;
  fileUrl: string;
  title: string;
  author: string;
  license: string;
  width: number;
  height: number;
  attributionHtml: string;
}

async function searchWikimedia(
  query: string,
): Promise<ImageCandidate[]> {
  try {
    const resp = await axios.get(
      "https://commons.wikimedia.org/w/api.php",
      {
        params: {
          action: "query",
          format: "json",
          generator: "search",
          gsrsearch: query,
          gsrnamespace: 6,
          gsrlimit: 5,
          prop: "imageinfo",
          iiprop: "url|extmetadata|size",
          origin: "*",
        },
        timeout: 15000,
        headers: { "User-Agent": USER_AGENT },
      },
    );

    const pages = resp.data?.query?.pages;
    if (!pages) return [];

    const candidates: ImageCandidate[] = [];
    for (const page of Object.values(pages) as any[]) {
      const info = page.imageinfo?.[0];
      if (!info) continue;

      const ext = info.extmetadata || {};
      const licenseRaw = ext.LicenseShortName?.value || "";
      const author =
        ext.Artist?.value?.replace(/<[^>]+>/g, "") || "Unknown";
      const title = page.title?.replace("File:", "") || "";

      const licenseNorm = licenseRaw.toLowerCase();
      const isAllowed = ALLOWED_LICENSES.some((l) =>
        licenseNorm.includes(l),
      );
      if (!isAllowed) continue;

      const pageUrl = `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`;
      candidates.push({
        pageUrl,
        fileUrl: info.url,
        title,
        author,
        license: licenseRaw,
        width: info.width,
        height: info.height,
        attributionHtml: `${title} by ${author}, ${licenseRaw}, via Wikimedia Commons`,
      });
    }
    return candidates;
  } catch (err: any) {
    console.error(`  Search failed for "${query}": ${err.message}`);
    return [];
  }
}

// License priority for ranking
function licenseScore(license: string): number {
  const l = license.toLowerCase();
  if (l.includes("public domain") || l.includes("pd") || l.includes("cc0"))
    return 3;
  if (l.includes("cc-by-sa")) return 1;
  if (l.includes("cc-by")) return 2;
  return 0;
}

async function main() {
  const inputFile =
    process.argv[2] ||
    path.resolve("agents/data/tickets.generated.jsonl");
  const outputFile =
    process.argv[3] ||
    path.resolve("agents/data/images.resolved.jsonl");

  if (!fs.existsSync(inputFile)) {
    console.error(`Input file not found: ${inputFile}`);
    console.error(
      "Generate tickets first using the Ticket Generator agent.",
    );
    process.exit(1);
  }

  const lines = fs
    .readFileSync(inputFile, "utf-8")
    .split("\n")
    .filter((l) => l.trim());
  console.log(`Processing ${lines.length} tickets...`);

  const output: string[] = [];
  let resolved = 0;
  let skipped = 0;

  for (let i = 0; i < lines.length; i++) {
    const ticket = JSON.parse(lines[i]);
    const queries: string[] =
      ticket.imageSearchQueries || ticket.imageSearchQ || [];

    if (queries.length === 0) {
      skipped++;
      continue;
    }

    console.log(
      `[${i + 1}/${lines.length}] ${ticket.scenarioHash || ticket.pddRef}`,
    );

    let bestCandidate: ImageCandidate | null = null;
    let bestScore = -1;

    for (const query of queries.slice(0, 3)) {
      const candidates = await searchWikimedia(query);
      for (const c of candidates) {
        const score = licenseScore(c.license);
        if (score > bestScore) {
          bestScore = score;
          bestCandidate = c;
        }
      }
      // Rate limiting: 1 request per second
      await new Promise((r) => setTimeout(r, 1000));
    }

    const result = {
      scenarioHash: ticket.scenarioHash,
      pddRef: ticket.pddRef,
      ticketId: ticket.id,
      image: bestCandidate,
    };

    output.push(JSON.stringify(result));

    if (bestCandidate) {
      resolved++;
      console.log(`  -> ${bestCandidate.title} (${bestCandidate.license})`);
    } else {
      console.log("  -> No suitable image found");
    }
  }

  fs.writeFileSync(outputFile, output.join("\n") + "\n", "utf-8");
  console.log(`\nDone: ${resolved} resolved, ${skipped} skipped (no queries)`);
  console.log(`Output: ${outputFile}`);
}

main().catch(console.error);
