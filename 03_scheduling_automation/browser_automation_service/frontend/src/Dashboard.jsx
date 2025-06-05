import React, { useState, useEffect, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  console.log("Dashboard component mounted"); // Initial debug log
  const [folder, setFolder] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState("");
  const [statusFilter, setStatusFilter] = useState('all');

  // Filter jobs based on status
  const filteredJobs = useMemo(() => {
    if (statusFilter === 'all') return jobs;
    return jobs.filter(job => job.status === statusFilter);
  }, [jobs, statusFilter]);

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusStyles = {
      queued: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };
    
    const statusIcons = {
      queued: '⏳',
      processing: '🔄',
      completed: '✅',
      failed: '❌',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusIcons[status] || '❓'} {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState("");
  const [jobStats, setJobStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  // Auto-dismiss success message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!folder.trim()) {
      setError("Please enter a folder name");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/queue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ folder }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Job submitted successfully! Job ID: ${data.id}`);
        setFolder(""); // Clear input after successful submission
        // Refresh jobs list
        fetchJobs();
      } else {
        setError(data.message || "Failed to submit job. Please try again.");
      }
    } catch (err) {
      console.error("Submission error:", err);
      setError("An unexpected error occurred. Please check the console.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchJobs = async () => {
      setJobsLoading(true);
      setJobsError("");
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("/api/jobs", {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error("Authentication failed. Please log in again.");
          } 
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // Sort by created_at descending (newest first)
        const sortedJobs = [...data].sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
        setJobs(sortedJobs);
      } catch (err) {
        console.error("Failed to fetch jobs:", err);
        setJobsError(err.message || "Failed to fetch jobs. Please try again.");
      }
      setJobsLoading(false);
    };

    const fetchLogs = async () => {
      setLogsLoading(true);
      setLogsError("");
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("/api/logs", {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error("Authentication failed for logs. Please log in again.");
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setLogs(data);
      } catch (err) {
        console.error("Failed to fetch logs:", err);
        setLogsError(err.message || "Failed to fetch logs. Please try again.");
      }
      setLogsLoading(false);
    };

    // Define all fetch functions first
    const fetchJobStats = async () => {
      setStatsLoading(true);
      setStatsError("");
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("/api/stats/jobs", {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error("Authentication failed for job stats. Please log in again.");
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setJobStats(data);
      } catch (err) {
        console.error("Failed to fetch job stats:", err);
        setStatsError(err.message || "Failed to fetch job stats. Please try again.");
      }
      setStatsLoading(false);
    };

    const fetchUserProfile = async () => {
      setProfileLoading(true);
      setProfileError("");
      try {
        const token = localStorage.getItem("token");
        console.log("Token from localStorage (profile fetch):", token); // Debug log

        const response = await fetch("/api/user/profile", {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json" // Added Content-Type
          },
        });
        console.log("Profile response status:", response.status); // Debug log

        if (!response.ok) {
          // Attempt to get more detailed error message from response body
          let errorMessage = `HTTP error! status: ${response.status}`;
          try {
            const errorData = await response.json();
            if (errorData && errorData.message) {
              errorMessage = errorData.message;
            }
            console.error("Profile error response data:", errorData); // Debug log
          } catch (e) {
            // If response is not JSON or errorData.message is not present, use the generic message
            console.error("Could not parse error response as JSON or get message from it:", e);
          }

          if (response.status === 401 || response.status === 403) {
            // Use specific message for auth errors, potentially overridden by server's message
            const authErrorMessage = "Authentication failed for user profile. Please log in again.";
            throw new Error(errorMessage !== `HTTP error! status: ${response.status}` ? errorMessage : authErrorMessage);
          }
          throw new Error(errorMessage);
        }
        const data = await response.json();
        setUserProfile(data);
      } catch (err) {
        console.error("Failed to fetch user profile (catch block):", err);
        setProfileError(err.message || "An unexpected error occurred while fetching user profile.");
      } finally { // Explicit finally block
        setProfileLoading(false);
      }
    };

    // Call all fetch functions for initial data load
    fetchJobs();
    fetchLogs();
    fetchJobStats();
    fetchUserProfile();

    // Set up intervals
    const jobsIntervalId = setInterval(fetchJobs, 30000);
    const logsIntervalId = setInterval(fetchLogs, 45000);
    const statsIntervalId = setInterval(fetchJobStats, 60000);
    // User profile is not polled by default, it's less likely to change frequently.

    // Cleanup function
    return () => {
      clearInterval(jobsIntervalId);
      clearInterval(logsIntervalId);
      clearInterval(statsIntervalId);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="max-w-5xl ml-32 text-center">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-900">Job Dashboard</h1>
        {/* Job Submission Card - Full width on small screens, centered */}
        <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-teal-700">Submit New Job</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="folder" className="block text-sm font-medium text-gray-700 mb-1">
                Folder Name
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="folder"
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                className={`w-full px-3 py-2 border ${error && !folder.trim() ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500`}
                placeholder="Enter folder name"
                disabled={isSubmitting}
                aria-invalid={!!(error && !folder.trim())}
                aria-describedby={error && !folder.trim() ? 'folder-error' : undefined}
              />
              {error && !folder.trim() && (
                <p className="mt-1 text-sm text-red-600" id="folder-error">
                  {error}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isSubmitting ? 'bg-teal-400' : 'bg-teal-600 hover:bg-teal-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors duration-200`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : 'Submit Job'}
            </button>
          </form>
        {message && (
          <div className="mt-4 rounded-md bg-green-50 p-4 transition-all duration-300 ease-in-out">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{message}</p>
              </div>
            </div>
          </div>
        )}
        {error && !error.includes("folder") && (
          <div className="mt-4 rounded-md bg-red-50 p-4 transition-all duration-300 ease-in-out">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid for main content cards - 2 columns on medium screens and up */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        
        {/* Recent Jobs Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-teal-700">Recent Jobs</h2>
          {jobsLoading && <p className="text-blue-700 bg-blue-100 p-3 rounded-md">Loading jobs...</p>}
          {jobsError && <p className="text-red-500 bg-red-100 p-3 rounded-md">{jobsError}</p>}
          {!jobsLoading && !jobsError && jobs.length === 0 && (
            <p className="text-gray-500">No jobs found.</p>
          )}
          {!jobsLoading && !jobsError && jobs.length > 0 && (
            <div className="overflow-x-auto"> {/* Removed redundant bg-white, p-4, shadow, rounded from inner div */}
              <div className="mb-4">
                <label htmlFor="status-filter" className="sr-only">Filter by status</label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="mt-1 block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md"
                >
                  <option value="all">All Statuses</option>
                  <option value="queued">Queued</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Folder</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-gray-900">{job.folder}</div>
                          <div className="text-xs text-gray-500 truncate max-w-xs" title={job.id}>
                            {job.id}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <StatusBadge status={job.status} />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(job.created_at).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDistanceToNow(new Date(job.updated_at), { addSuffix: true })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(job.updated_at).toLocaleString()}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Recent Logs Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-teal-700">Recent Logs</h2>
          {logsLoading && <p className="text-blue-700 bg-blue-100 p-3 rounded-md">Loading logs...</p>}
          {logsError && <p className="text-red-500 bg-red-100 p-3 rounded-md">{logsError}</p>}
          {!logsLoading && !logsError && logs.length === 0 && (
            <p className="text-gray-500">No logs found.</p>
          )}
          {!logsLoading && !logsError && logs.length > 0 && (
            <div className="max-h-96 overflow-y-auto"> {/* Removed redundant bg-white, p-4, shadow, rounded from inner div */}
              <ul className="divide-y divide-gray-200">
                {logs.map((logEntry) => (
                  <li key={logEntry.id} className="py-3">
                    <p className="text-xs text-gray-500 mb-1">{new Date(logEntry.timestamp).toLocaleString()} - Job: <span className="font-medium text-gray-700 truncate" title={logEntry.job_id}>{logEntry.job_id}</span></p>
                    <p className={`text-sm ${logEntry.level === 'error' ? 'text-red-700' : logEntry.level === 'warn' ? 'text-yellow-700' : 'text-gray-800'}`}>{logEntry.message}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div> {/* End of first grid row (Jobs & Logs) */}

      {/* Grid for second row of content cards - 2 columns on medium screens and up */}
      <div className="grid md:grid-cols-2 gap-6"> {/* Removed mb-8 from the last grid container */}
        
        {/* Job Statistics Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-teal-700">Job Statistics</h2>
          {statsLoading && <p className="text-blue-700 bg-blue-100 p-3 rounded-md">Loading statistics...</p>}
          {statsError && <p className="text-red-500 bg-red-100 p-3 rounded-md">{statsError}</p>}
          {!statsLoading && !statsError && jobStats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"> {/* Adjusted grid for stats items */}
              {Object.entries(jobStats).map(([status, count]) => (
                <div key={status} className="bg-white p-4 rounded-lg shadow-sm text-center"> {/* Slightly different styling for stat items */}
                  <p className="text-2xl font-bold text-teal-600">{count}</p>
                  <p className="text-sm text-gray-600 capitalize">{status}</p>
                </div>
              ))}
            </div>
          )}
          {!statsLoading && !statsError && !jobStats && (
            <p className="text-gray-500">No job statistics available.</p>
          )}
        </div>

        {/* User Profile Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-teal-700">User Profile</h2>
          {profileLoading && <p className="text-blue-700 bg-blue-100 p-3 rounded-md">Loading profile...</p>}
          {profileError && <p className="text-red-500 text-sm">Error: {profileError}</p>}
          {!profileLoading && !profileError && userProfile && (
            <div> {/* Removed redundant bg-white, p-6, shadow, rounded from inner div */}
              <p className="text-gray-700"><span className="font-semibold mr-2">User ID:</span> {userProfile.id}</p>
              <p className="text-gray-700 mt-2"><span className="font-semibold mr-2">Email:</span> {userProfile.email}</p>
              <p className="text-gray-700 mt-2"><span className="font-semibold mr-2">Member Since:</span> {new Date(userProfile.created_at).toLocaleDateString()}</p>
            </div>
          )}
          {!profileLoading && !profileError && !userProfile && (
            <p className="text-gray-500">Could not load user profile.</p>
          )}
        </div>
      </div> {/* End of second grid row (Stats & Profile) */}
      </div>
    </div>
  );
}
