import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link
} from "react-router-dom";
import Dashboard from "./Dashboard.jsx";
import Tasks from "./Tasks.jsx";
import Login from "./Login.jsx";

export default function App() {
  return (
    <Router>
      <header className="bg-gray-100 p-4 flex space-x-4 max-w-4xl mx-auto">
        <Link to="/dashboard" className="text-blue-600 hover:underline">Dashboard</Link>
        <Link to="/tasks" className="text-blue-600 hover:underline">Tasks</Link>
        <Link to="/login" className="text-blue-600 hover:underline ml-auto">Login</Link>
        <Link to="/tasks">Tasks</Link>
        <Link to="/schedules">Schedules</Link>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
	  <Route path="/schedules" element={<Schedules />} />
        </Routes>
      </main>
    </Router>
  );
}