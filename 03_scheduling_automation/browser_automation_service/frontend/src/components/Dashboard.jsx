import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/dashboard")
      .then(res => res.text())
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const entries = Array.from(doc.querySelectorAll("h3")).map(section => {
          const folder = section.textContent;
          const files = Array.from(section.nextElementSibling.querySelectorAll("li a"))
            .map(a => ({ name: a.textContent, href: a.getAttribute("href") }));
          return { folder, files };
        });
        setLogs(entries);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Log Dashboard</h2>
      {loading && <p>Loading logs...</p>}
      {!loading && logs.length === 0 && <p>No logs available.</p>}
      <div className="space-y-6">
        {logs.map(log => (
          <div key={log.folder} className="bg-white rounded-xl shadow p-4">
            <h3 className="text-lg font-semibold mb-2">Session: {log.folder}</h3>
            <ul className="list-disc list-inside text-sm space-y-1">
              {log.files.map(file => (
                <li key={file.name}>
                  <Link
                    to={`/log/${log.folder}/${file.name}`}
                    className="text-blue-600 hover:underline"
                  >
                    {file.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
