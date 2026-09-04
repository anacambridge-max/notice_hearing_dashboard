'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { BarChart, Bar, CartesianGrid, LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { groupByCentre, groupByDate, metrics, deriveSchedule, type Row } from '@/lib/normalize';

type Data = { roughData: Row[]; hearingEntries: Row[]; centreWise: Row[]; schedule: Row[]; dateWise: Row[]; fetchedAt: string };

type DerivedRow = Row & { __id: string; __date: string; __centre: string; __status: string };

const nav = [['Overview','/'],['Hearing Schedule','/#schedule'],['Centre Wise','/#centre'],['Date Wise','/#date'],['For Hearing Entry','/#entries'],['Rough Data','/#rough']];

function Table({ rows, limit }: { rows: Row[]; limit?: number }) {
  const visible = limit ? rows.slice(0, limit) : rows;
  const headers = rows.length ? Object.keys(rows[0]) : [];
  if (!rows.length) return <div className="muted">No records found.</div>;
  return <div className="table-wrap"><table className="table"><thead><tr>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{visible.map((row, i) => <tr key={i}>{headers.map(h => <td key={h}>{row[h]}</td>)}</tr>)}</tbody></table></div>;
}

export default function Dashboard({ initialData }: { initialData: Data }) {
  const [data, setData] = useState(initialData);
  const [q, setQ] = useState('');
  const [centre, setCentre] = useState('all');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function refresh() {
    setBusy(true); setError('');
    try { const r = await fetch('/api/data?refresh=1', { cache: 'no-store' }); const body = await r.json(); if (!r.ok) throw new Error(body.error || 'Refresh failed'); setData(body); }
    catch (e) { setError(e instanceof Error ? e.message : 'Refresh failed'); }
    finally { setBusy(false); }
  }

  const schedule = useMemo<DerivedRow[]>(() => deriveSchedule(data.schedule), [data.schedule]);
  const centreOptions = useMemo(() => [...new Set(schedule.map(r => r.__centre).filter(Boolean))].sort(), [schedule]);
  const filtered = useMemo<DerivedRow[]>(() => schedule.filter(r => (!q || Object.values(r).join(' ').toLowerCase().includes(q.toLowerCase())) && (centre === 'all' || r.__centre === centre)), [schedule, q, centre]);
  const m = metrics(data.schedule);
  const cdata = groupByCentre(data.schedule).slice(0, 12);
  const ddata = groupByDate(data.schedule).slice(-30);

  const exportCsv = () => {
    const rows: Row[] = filtered.map((row) => {
      const { __id, __date, __centre, __status, ...clean } = row;
      void __id; void __date; void __centre; void __status;
      return clean;
    });
    const headers: string[] = rows.length ? Object.keys(rows[0]) : [];
    const csv = [headers, ...rows.map((r: Row) => headers.map((h: string) => `"${String(r[h] ?? '').replaceAll('"','""')}"`))].map(x => x.join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'hearing-schedule.csv'; a.click(); URL.revokeObjectURL(a.href);
  };

  return <main className="shell">
    <header className="topbar"><div className="topbar-inner"><div><div className="brand">For Hearing Schedule</div><div className="subbrand">Hearing Administration Dashboard</div></div><div className="grow"/><span className="subbrand">Last updated: {new Date(data.fetchedAt).toLocaleString('en-IN')}</span><button className="btn" onClick={() => document.documentElement.classList.toggle('dark')}>Theme</button><button className="btn btn-dark" onClick={refresh}>{busy ? 'Refreshing…' : 'Refresh now'}</button></div></header>
    <div className="layout"><aside className="sidebar"><nav className="nav">{nav.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</nav></aside>
      <section className="main">
        <div className="title-row"><div><div className="eyebrow">Administrative control view</div><h1 className="title">Hearing Schedule Overview</h1><div className="muted">Live data from the Google Sheet. Updates are picked up automatically within the configured cache window.</div></div></div>
        {error && <div className="panel" style={{marginBottom:14}}>Unable to refresh: {error}</div>}
        <div className="cards"><div className="card"><div className="card-label">Total hearings</div><div className="card-value">{m.total}</div></div><div className="card"><div className="card-label">Next 7 days</div><div className="card-value">{m.upcoming}</div></div><div className="card"><div className="card-label">Pending</div><div className="card-value">{m.pending}</div></div><div className="card"><div className="card-label">Completed</div><div className="card-value">{m.completed}</div></div></div>
        <div className="grid2"><section className="panel" id="centre"><h2>Centre-wise hearings</h2><div className="chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={cdata}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="centre" tick={{fontSize:11}}/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="count" name="Hearings"/></BarChart></ResponsiveContainer></div></section><section className="panel" id="date"><h2>Hearings by date</h2><div className="chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={ddata}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fontSize:11}}/><YAxis allowDecimals={false}/><Tooltip/><Line type="monotone" dataKey="count" name="Hearings"/></LineChart></ResponsiveContainer></div></section></div>
        <section className="panel" id="schedule" style={{marginTop:14}}><div className="title-row"><div><h2 style={{marginBottom:4}}>Hearing Schedule Report</h2><div className="muted">{filtered.length} matching records</div></div><button className="btn" onClick={exportCsv}>Export CSV</button></div><div className="toolbar"><input className="input" placeholder="Search schedule…" value={q} onChange={e=>setQ(e.target.value)}/><select className="select" value={centre} onChange={e=>setCentre(e.target.value)}><option value="all">All centres</option>{centreOptions.map(c=><option key={c} value={c}>{c}</option>)}</select></div><Table rows={filtered} limit={250}/></section>
        <section className="panel" id="entries" style={{marginTop:14}}><h2>For Hearing Entry</h2><Table rows={data.hearingEntries} limit={100}/></section>
        <section className="panel" id="rough" style={{marginTop:14}}><h2>Rough Data</h2><Table rows={data.roughData} limit={100}/></section>
        <div className="footer-note">Data is read-only from Google Sheets. Exact column-aware rules can be tightened once the production header names are finalized.</div>
      </section></div></main>;
}
