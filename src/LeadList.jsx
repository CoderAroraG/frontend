import React, { useEffect, useState } from "react";
import "./LeadList.css";

const BASE_URL = "http://localhost:5000";

export default function LeadList() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [datePickerIndex, setDatePickerIndex] = useState(null);
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads(date = null) {
    setLoading(true);
    try {
      const url = date
        ? `${BASE_URL}/api/filter-leads?date=${date}`
        : `${BASE_URL}/api/leads`;
      const res = await fetch(url);
      const data = await res.json();
      setLeads(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch leads error:", err);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }

  // ✅ Fix: update correct columns after backend update-call
  function updateLeadInState(index, updatedRow) {
    setLeads((prev) =>
      prev.map((lead, i) =>
        i === index
          ? {
              ...lead,
              status: updatedRow[0],        // D
              lastCalled: updatedRow[1],    // E
              remarks: updatedRow[2],       // F
              followUps: updatedRow[3],     // G
              followUpDates: updatedRow[4], // H
              callTime: updatedRow[5],      // I
            }
          : lead
      )
    );
  }

  async function handleCall(index) {
    const lead = leads[index];
    if (lead?.phone) window.location.href = `tel:${lead.phone}`;

    try {
      const res = await fetch(`${BASE_URL}/api/update-call/${index}`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success && data.updatedRow) {
        const updatedRow = [...data.updatedRow];
        updateLeadInState(index, updatedRow);
      }
    } catch (err) {
      console.error("Update call error:", err);
    }
  }

  async function handleNextCallDate(index, value) {
    if (!value) return;

    const dateObj = new Date(value);
    const formattedDate = `${dateObj.getDate()} ${dateObj.toLocaleString("default", {
      month: "short",
    })}`;

    try {
      await fetch(`${BASE_URL}/api/update-next-call/${index}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nextCallDate: formattedDate }),
      });
      setDatePickerIndex(null);
      fetchLeads(filterDate ? filterDate : null);
    } catch (err) {
      console.error("Error updating next call date:", err);
    }
  }

  async function handleRemark(index, remark) {
    try {
      await fetch(`${BASE_URL}/api/update-remarks/${index}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remark }),
      });
      fetchLeads(filterDate ? filterDate : null);
    } catch (err) {
      console.error("Error updating remark:", err);
    }
  }

  function applyFilter() {
    if (filterDate) fetchLeads(filterDate);
    else fetchLeads();
  }

  // ✅ Added: Date sorter
  function sortByDate() {
    const sorted = [...leads].sort((a, b) => {
      if (!a.nextCallDate) return 1;
      if (!b.nextCallDate) return -1;
      const dateA = new Date(a.nextCallDate);
      const dateB = new Date(b.nextCallDate);
      return dateA - dateB;
    });
    setLeads(sorted);
  }

  return (
    <div className="lead-container">
      <div className="lead-header">
        <h2>Lead Tracker</h2>
        <button onClick={() => fetchLeads()} disabled={loading} className="refresh-btn">
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="filter-bar">
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="filter-input"
        />
        <button onClick={applyFilter} className="filter-btn">
          Apply Filter
        </button>
        <button
          onClick={() => {
            setFilterDate("");
            fetchLeads();
          }}
          className="clear-btn"
        >
          Clear
        </button>
        {/* ✅ New sort button */}
        <button onClick={sortByDate} className="sort-btn">
          Sort by Date
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
            <th>Call Remarks</th>
            <th>Follow-Ups</th>
            <th>Follow-Up Dates</th>
            <th>Call Time</th>
          </tr>
        </thead>
        <tbody>
          {leads.length === 0 ? (
            <tr>
              <td colSpan="9" className="no-leads">
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
                <td>
                  <button
                    className="date-btn"
                    onClick={() =>
                      setDatePickerIndex(datePickerIndex === i ? null : i)
                    }
                  >
                    {lead.nextCallDate || "Set Date"}
                  </button>
                  {datePickerIndex === i && (
                    <div className="date-picker-wrap">
                      <input
                        type="date"
                        className="date-picker"
                        onChange={(e) => handleNextCallDate(i, e.target.value)}
                        autoFocus
                      />
                    </div>
                  )}
                </td>
                <td className={`status ${lead.status?.toLowerCase()}`}>
                  {lead.status || "-"}
                </td>
                <td>{lead.lastCalled || "-"}</td>
                <td>
                  <textarea
                    className="remark-input"
                    placeholder="Add remark..."
                    onBlur={(e) => handleRemark(i, e.target.value)}
                  />
                  <div className="remark-display">{lead.remarks}</div>
                </td>
                <td>{lead.followUps || "0"}</td>
                <td className="followup-cell">
                  {lead.followUpDates || "-"}
                </td>
                <td>{lead.callTime || "-"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
