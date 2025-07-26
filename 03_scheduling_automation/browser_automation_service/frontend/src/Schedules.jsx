// src/Schedules.jsx
import React, { useEffect, useState } from 'react';
import { formatISO } from 'date-fns';

export default function Schedules() {
  const [list, setList] = useState([]);
  const [folder, setFolder] = useState('');
  const [time, setTime] = useState('');
  const [rrule, setRrule] = useState('');

  const fetchSchedules = () => {
    fetch('/api/schedules')
      .then(r => r.json())
      .then(setList);
  };

  useEffect(fetchSchedules, []);

  const handleSubmit = async e => {
    e.preventDefault();
    await fetch('/api/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        folder,
        schedule_time: time,
        recurrence_rule: rrule || null,
      }),
    });
    setFolder(''); setTime(''); setRrule('');
    fetchSchedules();
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Schedule a New Job</h2>
      <form onSubmit={handleSubmit} className="mb-6 space-y-4">
        <input
          type="text"
          placeholder="Folder/session name"
          value={folder}
          onChange={e => setFolder(e.target.value)}
          required
          className="w-full border p-2 rounded"
        />
        <input
          type="datetime-local"
          value={time}
          onChange={e => setTime(e.target.value)}
          required
          className="w-full border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Recurrence rule (RRULE)"
          value={rrule}
          onChange={e => setRrule(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Schedule
        </button>
      </form>

      <h2 className="text-xl font-bold mb-2">Upcoming Schedules</h2>
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr>
            <th className="border px-2 py-1">Folder</th>
            <th className="border px-2 py-1">Next Run</th>
            <th className="border px-2 py-1">Recurrence</th>
            <th className="border px-2 py-1">Status</th>
          </tr>
        </thead>
        <tbody>
          {list.map(s => (
            <tr key={s.id}>
              <td className="border px-2 py-1">{s.folder}</td>
              <td className="border px-2 py-1">{new Date(s.schedule_time).toLocaleString()}</td>
              <td className="border px-2 py-1 font-mono text-sm">{s.recurrence_rule || '-'}</td>
              <td className="border px-2 py-1">{s.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}