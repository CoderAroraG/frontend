import React, { useEffect, useState } from "react";
import "./LeadList.css";

export default function LeadList() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    setLoading(true);
    try {
      const res = await fetch("https://leadtest-f5zr.onrender.com/api/leads");
      const data = await res.json();
      setLeads(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch leads error:", err);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCall(index) {
    const lead = leads[index];
    if (lead && lead.phone) {
      window.location.href = `tel:${lead.phone}`;
    }

    try {
      await fetch(`https://leadtest-f5zr.onrender.com/api/update-call/${index}`, { method: "POST" });
      fetchLeads();
    } catch (err) {
      console.error("Update call error:", err);
    }
  }

  return (
    <div className="lead-container">
      <div className="lead-header">
        <h2>Lead Tracker</h2>
        <button onClick={fetchLeads} disabled={loading} className="refresh-btn">
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <table className="lead-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>Next Call Date</th>
            <th>Status</th>
            <th>Last Called</th>
            <th>Follow-Ups</th>
            <th>Follow-Up Dates</th>
            <th>Call Time</th>
          </tr>
        </thead>
        <tbody>
          {leads.length === 0 ? (
            <tr>
              <td colSpan="8" className="no-leads">
                {loading ? "Loading..." : "No leads found"}
              </td>
            </tr>
          ) : (
            leads.map((lead, i) => (
              <tr key={i}>
                <td>{lead.name || "-"}</td>
                <td>
                  <button className="phone-btn" onClick={() => handleCall(i)}>
                    {lead.phone || "-"}
                  </button>
                </td>
                <td>{lead.nextCallDate || "-"}</td>
                <td className={`status ${lead.status?.toLowerCase()}`}>
                  {lead.status || "-"}
                </td>
                <td>{lead.lastCalled || "-"}</td>
                <td>{lead.followUps || "0"}</td>
                <td className="followup-cell">{lead.followUpDates || "-"}</td>
                <td>{lead.callTime || "-"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
