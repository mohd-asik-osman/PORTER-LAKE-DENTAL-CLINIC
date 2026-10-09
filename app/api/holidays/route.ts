import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'holidays.json');

interface HolidayRecord {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  type: string;
  notes?: string;
  createdAt: string;
  createdBy?: string;
}

function getStoredHolidays(): HolidayRecord[] {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const raw = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading holidays data file:', err);
  }
  return [
    {
      id: 'closure-2026-10-05',
      title: 'Clinic Closure',
      startDate: '2026-10-05',
      endDate: '2026-10-05',
      type: 'closure',
      notes: 'Scheduled Clinic Closure',
      createdAt: new Date().toISOString(),
      createdBy: 'admin'
    }
  ];
}

function saveStoredHolidays(data: HolidayRecord[]) {
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
  const holidays = getStoredHolidays();
  return NextResponse.json({
    success: true,
    holidays: holidays.sort((a, b) => a.startDate.localeCompare(b.startDate))
  });
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    if (!payload.title || !payload.startDate || !payload.endDate) {
      return NextResponse.json({ error: 'Title, startDate, and endDate are required' }, { status: 400 });
    }

    const start = payload.startDate <= payload.endDate ? payload.startDate : payload.endDate;
    const end = payload.startDate <= payload.endDate ? payload.endDate : payload.startDate;

    const newRecord: HolidayRecord = {
      id: payload.id || `closure-${Date.now()}`,
      title: String(payload.title).trim(),
      startDate: start,
      endDate: end,
      type: payload.type || 'closure',
      notes: payload.notes ? String(payload.notes).trim() : '',
      createdAt: payload.createdAt || new Date().toISOString(),
      createdBy: payload.createdBy || 'admin'
    };

    const current = getStoredHolidays();
    const updated = [...current.filter(h => h.id !== newRecord.id), newRecord];
    saveStoredHolidays(updated);

    return NextResponse.json({ success: true, record: newRecord });
  } catch (err) {
    console.error('Error adding holiday:', err);
    return NextResponse.json({ error: 'Failed to save holiday' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID parameter is required' }, { status: 400 });
    }

    const current = getStoredHolidays();
    const filtered = current.filter(h => h.id !== id);
    saveStoredHolidays(filtered);

    return NextResponse.json({ success: true, removedId: id });
  } catch (err) {
    console.error('Error deleting holiday:', err);
    return NextResponse.json({ error: 'Failed to delete holiday' }, { status: 500 });
  }
}
