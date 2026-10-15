import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const PRIMARY_DATA_FILE_PATH = path.join(process.cwd(), 'data', 'holidays.json');
const TMP_DATA_FILE_PATH = '/tmp/dentacare_holidays.json';

export interface HolidayRecord {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  type: string;
  notes?: string;
  createdAt: string;
  createdBy?: string;
}

// Default initial statutory closures
const DEFAULT_FALLBACK_HOLIDAYS: HolidayRecord[] = [
  {
    id: 'statutory-thanksgiving-2026',
    title: 'Thanksgiving Day',
    startDate: '2026-10-12',
    endDate: '2026-10-12',
    type: 'holiday',
    notes: 'Statutory Holiday',
    createdAt: '2026-10-01T13:00:00.000Z',
    createdBy: 'admin'
  },
  {
    id: 'statutory-remembrance-2026',
    title: 'Remembrance Day',
    startDate: '2026-11-11',
    endDate: '2026-11-11',
    type: 'holiday',
    notes: 'Statutory Holiday',
    createdAt: '2026-10-01T13:00:00.000Z',
    createdBy: 'admin'
  },
  {
    id: 'statutory-christmas-2026',
    title: 'Christmas & Boxing Day Closure',
    startDate: '2026-12-24',
    endDate: '2026-12-26',
    type: 'holiday',
    notes: 'Clinic Winter Break',
    createdAt: '2026-10-01T13:00:00.000Z',
    createdBy: 'admin'
  }
];

// In-memory cache for serverless environments (e.g. Vercel, Netlify) with read-only filesystems
let inMemoryHolidays: HolidayRecord[] = [...DEFAULT_FALLBACK_HOLIDAYS];
let isInitialized = false;

function getStoredFileHolidays(): HolidayRecord[] {
  // 1. Try reading from primary local file
  try {
    if (fs.existsSync(PRIMARY_DATA_FILE_PATH)) {
      const raw = fs.readFileSync(PRIMARY_DATA_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryHolidays = parsed;
        isInitialized = true;
        return parsed;
      }
    }
  } catch (_) {}

  // 2. Try reading from serverless /tmp fallback file
  try {
    if (fs.existsSync(TMP_DATA_FILE_PATH)) {
      const raw = fs.readFileSync(TMP_DATA_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryHolidays = parsed;
        isInitialized = true;
        return parsed;
      }
    }
  } catch (_) {}

  if (!isInitialized) {
    saveStoredFileHolidays(DEFAULT_FALLBACK_HOLIDAYS);
    isInitialized = true;
  }

  return inMemoryHolidays;
}

function saveStoredFileHolidays(data: HolidayRecord[]) {
  inMemoryHolidays = data;

  // 1. Attempt writing to primary path (works in containerized / local / Cloud Run)
  let wrotePrimary = false;
  try {
    const dir = path.dirname(PRIMARY_DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(PRIMARY_DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    wrotePrimary = true;
  } catch (err: any) {
    // Expected on read-only serverless filesystems (e.g. Vercel / AWS Lambda EROFS)
    if (err?.code !== 'EROFS') {
      console.warn('Note: Primary file write avoided (read-only environment):', err?.message || err);
    }
  }

  // 2. Fallback to writable /tmp directory if primary was read-only
  if (!wrotePrimary) {
    try {
      fs.writeFileSync(TMP_DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (_) {}
  }
}

export async function GET() {
  try {
    const fileHolidays = getStoredFileHolidays();
    const sorted = [...fileHolidays].sort((a, b) => a.startDate.localeCompare(b.startDate));
    return NextResponse.json({
      success: true,
      source: 'server',
      holidays: sorted
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
      }
    });
  } catch (err) {
    console.error('Failed to get holidays:', err);
    return NextResponse.json({ success: true, holidays: inMemoryHolidays }, { status: 200 });
  }
}

function formatToYYYYMMDD(str: string): string {
  if (!str) return '';
  return str.split('T')[0].trim();
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // Support batch array of holidays
    if (Array.isArray(payload.holidays)) {
      const batchList: HolidayRecord[] = [];
      for (const item of payload.holidays) {
        if (item.title && item.startDate && item.endDate) {
          const rawStart = formatToYYYYMMDD(item.startDate);
          const rawEnd = formatToYYYYMMDD(item.endDate);
          const start = rawStart <= rawEnd ? rawStart : rawEnd;
          const end = rawStart <= rawEnd ? rawEnd : rawStart;
          const record: HolidayRecord = {
            id: item.id || `closure-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            title: String(item.title).trim(),
            startDate: start,
            endDate: end,
            type: item.type || 'closure',
            notes: item.notes ? String(item.notes).trim() : '',
            createdAt: item.createdAt || new Date().toISOString(),
            createdBy: item.createdBy || 'admin'
          };
          batchList.push(record);
        }
      }

      // Update storage
      const current = getStoredFileHolidays();
      const map = new Map<string, HolidayRecord>();
      current.forEach(h => map.set(h.id, h));
      batchList.forEach(b => map.set(b.id, b));
      const updated = Array.from(map.values()).sort((a, b) => a.startDate.localeCompare(b.startDate));
      saveStoredFileHolidays(updated);

      return NextResponse.json({ success: true, count: batchList.length, holidays: updated }, {
        headers: { 'Cache-Control': 'no-store, max-age=0' }
      });
    }

    // Single holiday item
    if (!payload.title || !payload.startDate || !payload.endDate) {
      return NextResponse.json({ error: 'Title, startDate, and endDate are required' }, { status: 400 });
    }

    const rawStart = formatToYYYYMMDD(payload.startDate);
    const rawEnd = formatToYYYYMMDD(payload.endDate);
    const start = rawStart <= rawEnd ? rawStart : rawEnd;
    const end = rawStart <= rawEnd ? rawEnd : rawStart;

    const newRecord: HolidayRecord = {
      id: payload.id || `closure-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: String(payload.title).trim(),
      startDate: start,
      endDate: end,
      type: payload.type || 'closure',
      notes: payload.notes ? String(payload.notes).trim() : '',
      createdAt: payload.createdAt || new Date().toISOString(),
      createdBy: payload.createdBy || 'admin'
    };

    // Update storage
    const current = getStoredFileHolidays();
    const updated = [...current.filter(h => h.id !== newRecord.id), newRecord].sort((a, b) => a.startDate.localeCompare(b.startDate));
    saveStoredFileHolidays(updated);

    return NextResponse.json({ success: true, record: newRecord, holidays: updated }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' }
    });
  } catch (err) {
    console.error('Error saving holiday:', err);
    return NextResponse.json({ success: false, error: 'Failed to save holiday record' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');
    if (!id) {
      try {
        const body = await req.json();
        id = body?.id;
      } catch (_) {}
    }

    if (!id) {
      return NextResponse.json({ error: 'ID parameter is required' }, { status: 400 });
    }

    // Atomically filter out the holiday from storage
    const current = getStoredFileHolidays();
    const filtered = current.filter(h => h.id !== id);
    saveStoredFileHolidays(filtered);

    return NextResponse.json({ success: true, removedId: id, holidays: filtered }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' }
    });
  } catch (err) {
    console.error('Error deleting holiday:', err);
    return NextResponse.json({ success: false, error: 'Failed to delete holiday record' }, { status: 500 });
  }
}
