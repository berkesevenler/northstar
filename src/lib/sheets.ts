import "server-only";
import { google, sheets_v4 } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

let cachedClient: sheets_v4.Sheets | null = null;
let cachedSpreadsheetId: string | null = null;
let initializedTabs: Set<string> | null = null;

function getEnv() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (!email || !rawKey || !spreadsheetId) {
    throw new Error(
      "Missing Google credentials. Set GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY and GOOGLE_SHEET_ID in .env.local.",
    );
  }

  // Handle both real newlines and the literal "\n" escape commonly seen in env files.
  const privateKey = rawKey.replace(/\\n/g, "\n");

  return { email, privateKey, spreadsheetId };
}

async function getSheets(): Promise<{
  sheets: sheets_v4.Sheets;
  spreadsheetId: string;
}> {
  if (cachedClient && cachedSpreadsheetId) {
    return { sheets: cachedClient, spreadsheetId: cachedSpreadsheetId };
  }
  const { email, privateKey, spreadsheetId } = getEnv();
  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: SCOPES,
  });
  await auth.authorize();
  const sheets = google.sheets({ version: "v4", auth });
  cachedClient = sheets;
  cachedSpreadsheetId = spreadsheetId;
  return { sheets, spreadsheetId };
}

/**
 * Each table is one tab in the spreadsheet.
 * Row 1 is headers; rows 2..N are data, mapped in order.
 */
export interface TableSchema<T extends { id: string }> {
  /** Tab name in the spreadsheet, e.g. "projects". */
  name: string;
  /** Ordered list of column keys; must include "id" as the first column. */
  columns: (keyof T & string)[];
  /** Convert a typed object to a flat row of strings for Sheets. */
  toRow: (item: T) => string[];
  /** Convert a row of strings back to a typed object. */
  fromRow: (row: string[]) => T;
}

async function ensureTab(name: string, headers: string[]): Promise<void> {
  if (initializedTabs && initializedTabs.has(name)) return;
  const { sheets, spreadsheetId } = await getSheets();

  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const existing = meta.data.sheets?.find((s) => s.properties?.title === name);

  if (!existing) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: { title: name },
            },
          },
        ],
      },
    });
  }

  // Always make sure headers are present in row 1.
  const headerRange = `${name}!A1:${columnLetter(headers.length)}1`;
  const headerResp = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: headerRange,
  });
  const current = headerResp.data.values?.[0] ?? [];
  const needsHeaders =
    current.length !== headers.length ||
    headers.some((h, i) => current[i] !== h);
  if (needsHeaders) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: headerRange,
      valueInputOption: "RAW",
      requestBody: { values: [headers] },
    });
  }

  if (!initializedTabs) initializedTabs = new Set();
  initializedTabs.add(name);
}

function columnLetter(n: number): string {
  // 1 -> A, 26 -> Z, 27 -> AA, ...
  let s = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

async function getSheetId(name: string): Promise<number> {
  const { sheets, spreadsheetId } = await getSheets();
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet = meta.data.sheets?.find((s) => s.properties?.title === name);
  if (!sheet?.properties?.sheetId && sheet?.properties?.sheetId !== 0) {
    throw new Error(`Sheet "${name}" not found.`);
  }
  return sheet.properties.sheetId!;
}

export async function listAll<T extends { id: string }>(
  schema: TableSchema<T>,
): Promise<T[]> {
  await ensureTab(schema.name, schema.columns);
  const { sheets, spreadsheetId } = await getSheets();
  const lastCol = columnLetter(schema.columns.length);
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${schema.name}!A2:${lastCol}`,
  });
  const rows = resp.data.values ?? [];
  return rows
    .filter((r) => r.length > 0 && (r[0] ?? "").trim() !== "")
    .map((r) => {
      // Pad short rows with empty strings.
      const padded = [...r];
      while (padded.length < schema.columns.length) padded.push("");
      return schema.fromRow(padded.map((v) => String(v ?? "")));
    });
}

export async function appendItem<T extends { id: string }>(
  schema: TableSchema<T>,
  item: T,
): Promise<T> {
  await ensureTab(schema.name, schema.columns);
  const { sheets, spreadsheetId } = await getSheets();
  const lastCol = columnLetter(schema.columns.length);
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${schema.name}!A:${lastCol}`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [schema.toRow(item)] },
  });
  return item;
}

async function findRowIndex(name: string, id: string): Promise<number> {
  // Returns 1-based row index in the sheet, or -1 if not found.
  const { sheets, spreadsheetId } = await getSheets();
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${name}!A:A`,
  });
  const rows = resp.data.values ?? [];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i]?.[0] === id) return i + 1;
  }
  return -1;
}

export async function updateItem<T extends { id: string }>(
  schema: TableSchema<T>,
  item: T,
): Promise<T> {
  await ensureTab(schema.name, schema.columns);
  const rowIdx = await findRowIndex(schema.name, item.id);
  if (rowIdx === -1) {
    throw new Error(`Item with id "${item.id}" not found in ${schema.name}.`);
  }
  const { sheets, spreadsheetId } = await getSheets();
  const lastCol = columnLetter(schema.columns.length);
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${schema.name}!A${rowIdx}:${lastCol}${rowIdx}`,
    valueInputOption: "RAW",
    requestBody: { values: [schema.toRow(item)] },
  });
  return item;
}

export async function deleteItem<T extends { id: string }>(
  schema: TableSchema<T>,
  id: string,
): Promise<void> {
  await ensureTab(schema.name, schema.columns);
  const rowIdx = await findRowIndex(schema.name, id);
  if (rowIdx === -1) return;
  const sheetId = await getSheetId(schema.name);
  const { sheets, spreadsheetId } = await getSheets();
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: rowIdx - 1,
              endIndex: rowIdx,
            },
          },
        },
      ],
    },
  });
}

export async function findItem<T extends { id: string }>(
  schema: TableSchema<T>,
  id: string,
): Promise<T | null> {
  const all = await listAll(schema);
  return all.find((x) => x.id === id) ?? null;
}
