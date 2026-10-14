import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'holidays.json');

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

// Default initial statutory closures if the file does not exist yet
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

function getStoredFileHolidays(): HolidayRecord[] {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const raw = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } else {
      saveStoredFileHolidays(DEFAULT_FALLBACK_HOLIDAYS);
      return DEFAULT_FALLBACK_HOLIDAYS;
    }
  } catch (err) {
    console.error('Error reading holidays data file:', err);
  }
  return DEFAULT_FALLBACK_HOLIDAYS;
}

function saveStoredFileHolidays(data: HolidayRecord[]) {
  try {
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing holidays data file:', err);
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
    return NextResponse.json({ success: false, error: 'Failed to retrieve holidays' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // Support batch array of holidays
    if (Array.isArray(payload.holidays)) {
      const batchList: HolidayRecord[] = [];
      for (const item of payload.holidays) {
        if (item.title && item.startDate && item.endDate) {
          const start = item.startDate <= item.endDate ? item.startDate : item.endDate;
          const end = item.startDate <= item.endDate ? item.endDate : item.startDate;
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

      // Update file storage atomically
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

    const start = payload.startDate <= payload.endDate ? payload.startDate : payload.endDate;
    const end = payload.startDate <= payload.endDate ? payload.endDate : payload.startDate;

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

    // Update file storage atomically
    const current = getStoredFileHolidays();
    const updated = [...current.filter(h => h.id !== newRecord.id), newRecord].sort((a, b) => a.startDate.localeCompare(b.startDate));
    saveStoredFileHolidays(updated);

    return NextResponse.json({ success: true, record: newRecord, holidays: updated }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' }
    });
  } catch (err) {
    console.error('Error adding holiday:', err);
    return NextResponse.json({ error: 'Failed to save holiday' }, { status: 500 });
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
    return NextResponse.json({ error: 'Failed to delete holiday' }, { status: 500 });
  }
}
