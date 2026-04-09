/**
 * Import all batch files (002-020) into the database.
 * Skips already-imported tickets (by scenarioHash).
 * Then publishes all drafts and runs fix-images.
 *
 * Usage: npx tsx agents/scripts/import-all-batches.ts
 */

import axios from "axios";
import * as fs from "fs";
import * as path from "path";

const API_URL = "http://localhost:3001/api";
const DATA_DIR = path.resolve(__dirname, "../data");

async function main() {
  // Login
  const loginRes = await axios.post(`${API_URL}/auth/login`, {
    email: "admin@road-rules.local",
    password: "admin123",
  });
  const token = loginRes.data.accessToken;
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  console.log("Authenticated\n");

  let totalCreated = 0;
  let totalErrors = 0;
  let totalSkipped = 0;

  // Import batches 002-020
  for (let i = 2; i <= 20; i++) {
    const batchNum = String(i).padStart(3, "0");
    const filePath = path.join(DATA_DIR, `batch-${batchNum}.json`);

    if (!fs.existsSync(filePath)) {
      console.log(`batch-${batchNum}: FILE MISSING — skip`);
      totalSkipped++;
      continue;
    }

    let data: any;
    try {
      data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch {
      console.log(`batch-${batchNum}: INVALID JSON — skip`);
      totalSkipped++;
      continue;
    }

    const tickets = data.tickets;
    if (!Array.isArray(tickets) || tickets.length === 0) {
      console.log(`batch-${batchNum}: NO TICKETS — skip`);
      totalSkipped++;
      continue;
    }

    // Validate and fix tickets
    const valid = tickets.filter((t: any) => {
      if (!t.questionRu || !t.questionUk || !t.scenarioHash || !t.pddRef) return false;
      if (!Array.isArray(t.options) || t.options.length !== 4) return false;
      const correct = t.options.filter((o: any) => o.isCorrect).length;
      if (correct !== 1) return false;
      // Ensure tags is array
      if (!Array.isArray(t.tags)) t.tags = ["general"];
      // Ensure difficulty is valid
      if (!["EASY", "MEDIUM", "HARD"].includes(t.difficulty)) t.difficulty = "MEDIUM";
      return true;
    });

    if (valid.length === 0) {
      console.log(`batch-${batchNum}: 0 valid tickets — skip`);
      totalSkipped++;
      continue;
    }

    // Import in chunks of 10 to avoid 413
    const CHUNK = 10;
    let batchCreated = 0;
    let batchErrors = 0;
    for (let c = 0; c < valid.length; c += CHUNK) {
      const chunk = valid.slice(c, c + CHUNK);
      try {
        const res = await axios.post(
          `${API_URL}/admin/tickets/import`,
          { tickets: chunk },
          { headers, timeout: 60000, maxBodyLength: 10 * 1024 * 1024 },
        );
        batchCreated += res.data.created;
        batchErrors += res.data.errors.length;
      } catch (e: any) {
        console.log(`  chunk ${c}-${c + chunk.length} failed: ${e.message}`);
        batchErrors += chunk.length;
      }
    }
    totalCreated += batchCreated;
    totalErrors += batchErrors;
    console.log(`batch-${batchNum}: ${valid.length} valid → ${batchCreated} created, ${batchErrors} dupes/errors`);
  }

  console.log(`\n=== Import Summary ===`);
  console.log(`Created: ${totalCreated}`);
  console.log(`Errors: ${totalErrors}`);
  console.log(`Skipped batches: ${totalSkipped}`);

  // Publish all drafts
  console.log("\nPublishing all drafts...");
  let published = 0;
  let page = 1;
  while (true) {
    const res = await axios.get(
      `${API_URL}/admin/tickets?status=DRAFT&pageSize=100&page=${page}`,
      { headers },
    );
    const drafts = res.data.data;
    if (drafts.length === 0) break;

    for (const t of drafts) {
      try {
        await axios.post(`${API_URL}/admin/tickets/${t.id}/publish`, {}, { headers });
        published++;
      } catch {}
    }
    if (res.data.total <= page * 100) break;
    page++;
  }
  console.log(`Published: ${published}`);

  // Final count
  const finalRes = await axios.get(`${API_URL}/tickets?pageSize=1`, { headers });
  console.log(`\nTotal published tickets: ${finalRes.data.total}`);
}

main().catch(console.error);
