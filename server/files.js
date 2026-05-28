import { parse } from 'csv-parse/sync';
import readXlsxFile from 'read-excel-file/node';
import { isLikelyEmail, normalizeEmail } from './reacher.js';

export async function extractEmails(file) {
  const name = file.originalname.toLowerCase();
  if (name.endsWith('.csv')) {
    return extractFromCsv(file.buffer);
  }
  if (name.endsWith('.xlsx')) {
    return extractFromWorkbook(file.buffer);
  }
  throw new Error('Invalid file format. Upload a CSV or XLSX file.');
}

function extractFromCsv(buffer) {
  const text = buffer.toString('utf8');
  const records = parse(text, {
    bom: true,
    skip_empty_lines: true,
    relax_column_count: true
  });
  return pickEmails(records);
}

async function extractFromWorkbook(buffer) {
  const rows = await readXlsxFile(buffer);
  return pickEmails(rows);
}

function pickEmails(rows) {
  const candidates = rows
    .flat()
    .map((value) => String(value || '').trim())
    .filter(Boolean);

  const emails = candidates.filter(isLikelyEmail);
  if (!emails.length) {
    throw new Error('No emails found. Use a single-column CSV or Excel file.');
  }
  return emails;
}

export function splitUniqueAndDuplicates(emails) {
  const seen = new Set();
  const unique = [];
  const duplicates = [];
  for (const email of emails) {
    const normalized = normalizeEmail(email);
    if (seen.has(normalized)) {
      duplicates.push(email);
    } else {
      seen.add(normalized);
      unique.push(email);
    }
  }
  return { unique, duplicates };
}
