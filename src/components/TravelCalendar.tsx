'use client';

import * as React from 'react';
import type { DateRange } from 'react-day-picker';
import type { TravelItinerary } from '@/lib/types';
import '@calendarjs/ce/dist/style.css';
import './TravelCalendar.css';

//  color scheme:
// morning white     oklch(0.90 0 0)       — swap (bg = text color; text = bg color)
// afternoon amber   oklch(0.72 0.18  50)
// evening teal      oklch(0.68 0.16 207)  — text = bg color

const BG_COLOR = 'oklch(0.15 0 0)';

function eventColors(startTime: string): { bgColor: string; textColor: string | null } {
  const h = parseInt(startTime.split(':')[0], 10);
  if (h < 12) return { bgColor: 'oklch(0.90 0 0)', textColor: BG_COLOR };
  if (h < 18) return { bgColor: 'oklch(0.72 0.18 50)', textColor: null };
  return { bgColor: 'oklch(0.68 0.16 207)', textColor: BG_COLOR };
}

//helpers for date/time parsing

function parseTo24Hour(timeStr: string): string {//better for placing events
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return timeStr;
  const [, h, m, period] = match;
  let hours = parseInt(h, 10);
  if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
  if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${m}`;
}

function addOneHour(time: string): string { //default event duration
  const [h, m] = time.split(':').map(Number);
  return `${String((h + 1) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function dateObjToLocalStr(date: Date): string { // calendarjs uses local getDay() to find week starts, so: be consistent and use local date strings everywhere to avoid timezone bugs
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Returns the local Sunday of the week containing dateStr.
//Specific calendarjs bug workaround: if dateStr's UTC midnight and local midnight fall on different days, shift forward by 1 day so calendarjs's local getDay() sees a Sunday.
function weekStartOfStr(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - date.getDay());
  return dateObjToLocalStr(date);
}

function weekLabelFrom(startStr: string, endStr: string): string { // e.g. "Mar 10 – Mar 16, 2024" goes above component (dynamic)
  const [sy, sm, sd] = startStr.split('-').map(Number);
  const [ey, em, ed] = endStr.split('-').map(Number);
  const s = new Date(sy, sm - 1, sd);
  const e = new Date(ey, em - 1, ed);
  const fmt = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleDateString('en-US', o);
  return `${fmt(s, { month: 'short', day: 'numeric' })} – ${fmt(e, { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

// calendarjs parses `value` as UTC midnight, then calls D.getDay() in LOCAL
// time to find the preceding Sunday. In western timezones (UTC−), the UTC
// midnight of a Sunday falls on Saturday locally, so calendarjs rolls back
// 6 extra days and displays the wrong week — events never appear.
//
// Fix: if UTC midnight and local midnight land on different days of week, shift
// the value forward by 1 day so calendarjs's local getDay() sees a Sunday.
function toScheduleValue(weekStartStr: string): string {
  const [y, m, d] = weekStartStr.split('-').map(Number);
  const utcMidnight  = new Date(weekStartStr);       // parses as UTC midnight
  const localSunday  = new Date(y, m - 1, d);        // local midnight
  if (utcMidnight.getDay() !== localSunday.getDay()) {
    const next = new Date(Date.UTC(y, m - 1, d + 1));
    return next.toISOString().substring(0, 10);
  }
  return weekStartStr;
}

// calendarjs header cells show the LOCAL getDate() of the UTC column date,
// which is 1 day early in western timezones. Overwrite them using our
// reliable React-tracked weekStart.
function fixHeaderDates(container: HTMLElement, weekStartStr: string): void {
  const [y, m, d] = weekStartStr.split('-').map(Number);
  const cells = container.querySelectorAll<HTMLElement>(
    '.lm-schedule thead td:not(:first-child)'
  );
  cells.forEach((cell, i) => {
    const date = new Date(y, m - 1, d + i);
    cell.textContent = String(date.getDate()).padStart(2, '0');
  });
}

// ── ICS builder ───────────────────────────────────────────────────────────────

function toICSDateTime(dateStr: string, timeStr: string): string {// Converts json response dates to "YYYYMMDDTHHMMSS"
  const [y, mo, d] = dateStr.split('-');
  const [h, min] = timeStr.split(':');
  return `${y}${mo}${d}T${h}${min}00`;
}

function escapeICS(v: string): string {// escape backslashes, semicolons, commas, and newlines
  return v.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function buildICS(events: any[], descMap: Map<string, string>): string {// Uses event GUIDs to look up descriptions in the descMap built during rendering.
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0',
    'PRODID:-//Travel Planner//EN', 'CALSCALE:GREGORIAN',
  ];
  for (const ev of events) {
    if (!ev.date) continue;
    const start  = ev.start ?? '09:00';
    const end    = ev.end   ?? addOneHour(start);
    const tzid   = ev.tzid as string | undefined;
    const dtProp = tzid ? `;TZID=${tzid}` : '';
    const desc   = descMap.get(ev.guid ?? '') ?? '';
    lines.push(
      'BEGIN:VEVENT',
      `UID:${ev.guid ?? String(Math.random()).slice(2)}@travel-planner`,
      `DTSTART${dtProp}:${toICSDateTime(ev.date, start)}`,
      `DTEND${dtProp}:${toICSDateTime(ev.date, end)}`,
      `SUMMARY:${escapeICS(String(ev.title ?? ''))}`,
      ...(desc ? [`DESCRIPTION:${escapeICS(desc)}`] : []),
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

// ── × delete-button DOM helpers ───────────────────────────────────────────────

function applyTextColor(itemEl: HTMLElement, textColorMap?: Map<string, string>) {
  if (itemEl.dataset.colored) return;
  itemEl.dataset.colored = '1';
  const guid = itemEl.id;
  if (!guid) return;
  const tc = textColorMap?.get(guid);
  if (tc) itemEl.style.color = tc;
}

function setupTextColors(container: HTMLElement, textColorMap?: Map<string, string>): MutationObserver {
  container.querySelectorAll<HTMLElement>('.lm-schedule-item').forEach(
    (el) => applyTextColor(el, textColorMap)
  );
  const obs = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of Array.from(m.addedNodes)) {
        if (!(node instanceof HTMLElement)) continue;
        if (node.classList.contains('lm-schedule-item')) applyTextColor(node, textColorMap);
        node.querySelectorAll<HTMLElement>('.lm-schedule-item').forEach(
          (el) => applyTextColor(el, textColorMap)
        );
      }
    }
  });
  obs.observe(container, { childList: true, subtree: true });
  return obs;
}

// ── component ─────────────────────────────────────────────────────────────────

interface TravelCalendarProps {
  result: TravelItinerary;
  dateRange: DateRange;
}

export function TravelCalendar({ result, dateRange }: TravelCalendarProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const scheduleRef    = React.useRef<any>(null);
  const observerRef    = React.useRef<MutationObserver | null>(null);
  const descMapRef     = React.useRef<Map<string, string>>(new Map());
  const textColorMapRef = React.useRef<Map<string, string>>(new Map());

  const initialDateStr = dateRange.from ? dateObjToLocalStr(dateRange.from) : '';
  const fromStr        = dateRange.from ? dateObjToLocalStr(dateRange.from) : '';
  const toStr          = dateRange.to   ? dateObjToLocalStr(dateRange.to)   : '';

  const [weekStart, setWeekStart] = React.useState<string>(() =>
    initialDateStr ? weekStartOfStr(initialDateStr) : ''
  );

  const weekEnd = React.useMemo(() => {
    if (!weekStart) return '';
    const [y, m, d] = weekStart.split('-').map(Number);
    return dateObjToLocalStr(new Date(y, m - 1, d + 6));
  }, [weekStart]);

  //no navigation to unselected weeks
  const canGoPrev = !!(weekStart && weekStart > fromStr);
  const canGoNext = !!(weekEnd && toStr && weekEnd < toStr);
  const weekLabel = weekStart && weekEnd ? weekLabelFrom(weekStart, weekEnd) : '';

  const events = React.useMemo(() => {
    let seq = 0;
    const newDesc = new Map<string, string>();
    const newTextColors = new Map<string, string>();
    // For each activity, create an event object:
      // contains a unique GUID, title, date, start/end times, color based on TOD, and timezone. 
    const list = result.days.flatMap((day) =>
      day.activities.map((activity) => {
        const guid   = `activity-${++seq}`;
        const time24 = parseTo24Hour(activity.time);
        const { bgColor, textColor } = eventColors(time24);
        newDesc.set(guid, activity.description);
        if (textColor) newTextColors.set(guid, textColor);
        return {
          guid,
          title: activity.title,
          date:  day.date,
          start: time24,
          end:   addOneHour(time24),
          color: bgColor,
          tzid:  day.timezone,
        };
      })
    );
    descMapRef.current = newDesc;
    textColorMapRef.current = newTextColors;
    return list;
  }, [result]);

  React.useEffect(() => {
    if (!containerRef.current || !initialDateStr) return;
    let mounted = true;

    const ws = weekStartOfStr(initialDateStr);
    setWeekStart(ws);

    import('@calendarjs/ce').then(({ default: calendarjs }) => {
      if (!mounted || !containerRef.current) return;

      observerRef.current?.disconnect();
      containerRef.current.innerHTML = '';
      scheduleRef.current = null;

      scheduleRef.current = calendarjs.Schedule(containerRef.current, {//Restrict calendar.js to only week-view
        type:  'week',
        value: toScheduleValue(ws),
        data:  events,
        grid:  15,//15-min intervals
        oncreate: (_self: any, newEvs: any[]) => {
          setTimeout(() => {
            if (!containerRef.current) return;
            for (const ev of newEvs) {
              const el = containerRef.current.querySelector<HTMLElement>(`#${CSS.escape(ev.guid)}`);
              if (el) applyTextColor(el, textColorMapRef.current);
            }
          }, 0);
        },
      });

      // Fix header day numbers immediately and again after reactive re-render.
      const applyHeaderFix = () => {
        if (containerRef.current) fixHeaderDates(containerRef.current, ws);
      };
      applyHeaderFix();
      setTimeout(applyHeaderFix, 50);

      observerRef.current = setupTextColors(containerRef.current, textColorMapRef.current);
    });

    return () => {
      mounted = false;
      observerRef.current?.disconnect();
      observerRef.current = null;
      if (containerRef.current) containerRef.current.innerHTML = '';
      scheduleRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, initialDateStr]);

  // ── navigation ───────────────────────────────────────────────────────────────

  function handlePrev() { //update header day numbers when we navigate
    if (!scheduleRef.current || !canGoPrev) return;
    const [y, m, d] = weekStart.split('-').map(Number);
    const newStart = dateObjToLocalStr(new Date(y, m - 1, d - 7));
    setWeekStart(newStart);
    scheduleRef.current.prev();
    setTimeout(() => {
      if (containerRef.current) fixHeaderDates(containerRef.current, newStart);
    }, 50);
  }

  function handleNext() {
    if (!scheduleRef.current || !canGoNext) return;
    const [y, m, d] = weekStart.split('-').map(Number);
    const newStart = dateObjToLocalStr(new Date(y, m - 1, d + 7));
    setWeekStart(newStart);
    scheduleRef.current.next();
    setTimeout(() => {
      if (containerRef.current) fixHeaderDates(containerRef.current, newStart);
    }, 50);
  }

  // ── ICS export ───────────────────────────────────────────────────────────────

  function handleExport() {//trigger download
    const data = scheduleRef.current?.getData() ?? [];
    const ics  = buildICS(data, descMapRef.current);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'travel-itinerary.ics';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  // ── render ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full px-6 py-4">
      {/* Navigation bar */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-0.5">
          <button
            onClick={handlePrev}
            disabled={!canGoPrev}
            aria-label="Previous week"
            className="p-1.5 rounded text-[10px] leading-none hover:bg-muted disabled:opacity-20 disabled:cursor-not-allowed transition-opacity"
          >
            ◀
          </button>
          <span className="text-sm font-medium w-48 text-center select-none">
            {weekLabel}
          </span>
          <button
            onClick={handleNext}
            disabled={!canGoNext}
            aria-label="Next week"
            className="p-1.5 rounded text-[10px] leading-none hover:bg-muted disabled:opacity-20 disabled:cursor-not-allowed transition-opacity"
          >
            ▶
          </button>
        </div>
        <button
          onClick={handleExport}
          className="text-xs px-3 py-1.5 rounded font-medium bg-[oklch(0.72_0.18_50)] text-[oklch(0.15_0_0)] hover:bg-[oklch(0.66_0.18_50)] transition-colors"
        >
          Export .ics
        </button>
      </div>

      {/* Schedule */}
      <div className="travel-calendar-wrapper flex-1 min-h-0 rounded-lg overflow-hidden border border-border">
        <div ref={containerRef} className="h-full" />
      </div>
    </div>
  );
}
