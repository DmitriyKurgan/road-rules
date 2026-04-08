/**
 * Ticket Import Script
 *
 * Reads a JSONL file of validated tickets and imports them
 * into the database via the admin API.
 *
 * Usage:
 *   npx tsx agents/scripts/import-tickets.ts [input] [--api-url URL] [--token TOKEN]
 *
 * Defaults:
 *   input:   agents/data/tickets.generated.jsonl
 *   api-url: http://localhost:3001/api
 *
 * The script will prompt for admin credentials if no token is provided.
 */

import axios from "axios";
import * as fs from "fs";
import * as path from "path";

const BATCH_SIZE = 50;

interface ImportResult {
  total: number;
  created: number;
  errors: Array<{ index: number; message: string }>;
}

function parseArgs() {
  const args = process.argv.slice(2);
  let inputFile = path.resolve("agents/data/tickets.generated.jsonl");
  let apiUrl = "http://localhost:3001/api";
  let token = "";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--api-url" && args[i + 1]) {
      apiUrl = args[++i];
    } else if (args[i] === "--token" && args[i + 1]) {
      token = args[++i];
    } else if (!args[i].startsWith("--")) {
      inputFile = path.resolve(args[i]);
    }
  }

  return { inputFile, apiUrl, token };
}

async function getAdminToken(
  apiUrl: string,
): Promise<string> {
  console.log("Logging in as admin...");
  const email = process.env.ADMIN_EMAIL || "admin@road-rules.local";
  const password = process.env.ADMIN_PASSWORD || "admin123";

  const res = await axios.post(`${apiUrl}/auth/login`, {
    email,
    password,
  });
  return res.data.accessToken;
}

async function importBatch(
  apiUrl: string,
  token: string,
  tickets: any[],
  batchNum: number,
): Promise<ImportResult> {
  const res = await axios.post(
    `${apiUrl}/admin/tickets/import`,
    { tickets },
    {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 30000,
    },
  );
  return res.data;
}

function validateTicket(ticket: any, index: number): string | null {
  if (!ticket.questionRu) return `[${index}] Missing questionRu`;
  if (!ticket.questionUk) return `[${index}] Missing questionUk`;
  if (!ticket.explanationRu) return `[${index}] Missing explanationRu`;
  if (!ticket.explanationUk) return `[${index}] Missing explanationUk`;
  if (!ticket.pddRef) return `[${index}] Missing pddRef`;
  if (!ticket.difficulty) return `[${index}] Missing difficulty`;
  if (!ticket.scenarioHash) return `[${index}] Missing scenarioHash`;
  if (!Array.isArray(ticket.options) || ticket.options.length !== 4) {
    return `[${index}] Must have exactly 4 options`;
  }
  const correctCount = ticket.options.filter(
    (o: any) => o.isCorrect,
  ).length;
  if (correctCount !== 1) {
    return `[${index}] Must have exactly 1 correct option, found ${correctCount}`;
  }
  if (!Array.isArray(ticket.tags) || ticket.tags.length === 0) {
    return `[${index}] Must have at least 1 tag`;
  }
  return null;
}

async function main() {
  const { inputFile, apiUrl, token: initialToken } = parseArgs();

  if (!fs.existsSync(inputFile)) {
    console.error(`Input file not found: ${inputFile}`);
    process.exit(1);
  }

  const lines = fs
    .readFileSync(inputFile, "utf-8")
    .split("\n")
    .filter((l) => l.trim());
  console.log(`Read ${lines.length} tickets from ${inputFile}`);

  // Parse and validate
  const tickets: any[] = [];
  const validationErrors: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    try {
      const ticket = JSON.parse(lines[i]);
      const err = validateTicket(ticket, i);
      if (err) {
        validationErrors.push(err);
      } else {
        tickets.push(ticket);
      }
    } catch {
      validationErrors.push(`[${i}] Invalid JSON`);
    }
  }

  if (validationErrors.length > 0) {
    console.error(`\nValidation errors (${validationErrors.length}):`);
    validationErrors.forEach((e) => console.error(`  ${e}`));
  }
  console.log(
    `\nValid: ${tickets.length}, Invalid: ${validationErrors.length}`,
  );

  if (tickets.length === 0) {
    console.error("No valid tickets to import.");
    process.exit(1);
  }

  // Get token
  const token = initialToken || (await getAdminToken(apiUrl));
  console.log("Authenticated.\n");

  // Import in batches
  let totalCreated = 0;
  let totalErrors = 0;
  const batches = Math.ceil(tickets.length / BATCH_SIZE);

  for (let b = 0; b < batches; b++) {
    const start = b * BATCH_SIZE;
    const batch = tickets.slice(start, start + BATCH_SIZE);
    console.log(
      `Batch ${b + 1}/${batches} (${batch.length} tickets)...`,
    );

    try {
      const result = await importBatch(apiUrl, token, batch, b + 1);
      totalCreated += result.created;
      totalErrors += result.errors.length;

      if (result.errors.length > 0) {
        result.errors.forEach((e) =>
          console.error(`  Error at #${start + e.index}: ${e.message}`),
        );
      }
      console.log(
        `  Created: ${result.created}, Errors: ${result.errors.length}`,
      );
    } catch (err: any) {
      console.error(
        `  Batch ${b + 1} failed: ${err.response?.data?.message || err.message}`,
      );
      totalErrors += batch.length;
    }
  }

  console.log(`\n=== Import Complete ===`);
  console.log(`Total created: ${totalCreated}`);
  console.log(`Total errors: ${totalErrors}`);
  console.log(`Total processed: ${tickets.length}`);
}

main().catch(console.error);
