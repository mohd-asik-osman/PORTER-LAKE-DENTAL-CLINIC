import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

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

// Fallback initial statutory closures if both Firestore and file are completely empty
const DEFAULT_FALLBACK_HOLIDAYS: HolidayRecord[] = [
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

function getStoredFileHolidays(): HolidayRecord[] {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const raw = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error reading fallback holidays data file:', err);
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
    console.error('Error writing fallback holidays data file:', err);
  }
}

export async function GET() {
  try {
    // 1. Try fetching live from Firestore first
    try {
      const snapshot = await getDocs(collection(db, 'holidays'));
      if (!snapshot.empty) {
        const cloudHolidays: HolidayRecord[] = snapshot.docs.map(d => ({
          ...d.data(),
          id: d.id
        } as HolidayRecord)).sort((a, b) => a.startDate.localeCompare(b.startDate));

        // Mirror to local disk cache for offline/cold-start fallback
        saveStoredFileHolidays(cloudHolidays);

        return NextResponse.json({
          success: true,
          source: 'cloud',
          holidays: cloudHolidays
        }, {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
          }
        });
      }
    } catch (firestoreError) {
      console.warn('Firestore GET /api/holidays fallback to local cache:', firestoreError);
    }

    // 2. Fallback to local file cache
    const fileHolidays = getStoredFileHolidays();
    return NextResponse.json({
      success: true,
      source: 'file',
      holidays: fileHolidays.sort((a, b) => a.startDate.localeCompare(b.startDate))
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

    // Support batch array or single item
    if (Array.isArray(payload.holidays)) {
      const batchList: HolidayRecord[] = [];
      for (const item of payload.holidays) {
        if (item.title && item.startDate && item.endDate) {
          const start = item.startDate <= item.endDate ? item.startDate : item.endDate;
          const end = item.startDate <= item.endDate ? item.endDate : item.startDate;
          const record: HolidayRecord = {
            id: item.id || `closure-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            title: String(item.title).trim(),
            startDate: start,
            endDate: end,
            type: item.type || 'closure',
            notes: item.notes ? String(item.notes).trim() : '',
            createdAt: item.createdAt || new Date().toISOString(),
            createdBy: item.createdBy || 'admin'
          };
          batchList.push(record);

          // Save each to Firestore
          try {
            await setDoc(doc(db, 'holidays', record.id), record);
          } catch (cloudErr) {
            console.warn(`Firestore save error for ${record.id}:`, cloudErr);
          }
        }
      }

      // Update local cache
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

    // Save to Firestore
    try {
      await setDoc(doc(db, 'holidays', newRecord.id), newRecord);
    } catch (cloudErr) {
      console.warn('Firestore setDoc notice in /api/holidays:', cloudErr);
    }

    // Mirror to local disk cache
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

    // Delete from Firestore
    try {
      await deleteDoc(doc(db, 'holidays', id));
    } catch (cloudErr) {
      console.warn('Firestore deleteDoc notice in /api/holidays:', cloudErr);
    }

    // Mirror to local disk cache
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
