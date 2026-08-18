
import React, { useEffect, useState } from "react";

export default function DateSearchHeader({
  showSearch,
  setShowSearch,
  sdate,
  setSdate,
  edate,
  setEdate,
  policeStations =[],
  selectedPoliceStation = "",
  setSelectedPoliceStation,
}) {
  // Today's date in YYYY-MM-DD format
  const getToday = () => {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const today = getToday();

  // Temporary values used inside modal
  const [tempSdate, setTempSdate] = useState(sdate);
  const [tempEdate, setTempEdate] = useState(edate);

  const [dateError, setDateError] = useState("");
  const [localPoliceStation, setLocalPoliceStation] = useState("");
  const isDashboardOrUpload =
    typeof window !== "undefined" &&
    ["/dashboard", "/upload"].includes(window.location.pathname);
  const policeStationValue = setSelectedPoliceStation
    ? selectedPoliceStation
    : localPoliceStation;
  // When modal opens, copy parent values
  useEffect(() => {
    if (showSearch) {
      setTempSdate(sdate);
      setTempEdate(edate);
      setDateError("");
    }
  }, [showSearch, sdate, edate]);

  function handleSearchSubmit(e) {
    e.preventDefault();

    setDateError("");

    // Required validation
    if (!tempSdate || !tempEdate) {
      setDateError("कृपया दोनों दिनांक भरें");
      return;
    }

    // Future date validation
    if (tempSdate > today) {
      setDateError("From Date भविष्य की तारीख नहीं हो सकती");
      return;
    }

    if (tempEdate > today) {
      setDateError("To Date भविष्य की तारीख नहीं हो सकती");
      return;
    }

    // From date cannot be greater than To date
    if (tempSdate > tempEdate) {
      setDateError("From Date, To Date से बड़ी नहीं हो सकती");
      return;
    }

    console.log(
      "handleSearchSubmit sdate:",
      tempSdate,
      "edate:",
      tempEdate
    );

    // Update parent ONLY after successful SEARCH
    setSdate(tempSdate);
    setEdate(tempEdate);

    setShowSearch(false);
  }

  function handleClose() {
    setDateError("");
    setShowSearch(false);
  }

  return (
    <div
      className="module-container card-upgrade"
      style={{ padding: "20px" }}
    >
      <div
        className="module-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <div className="module-title-group">
          <div
            style={{
              marginTop: "6px",
              fontSize: "14px",
              color: "#64748b",
            }}
          >
            📅 {sdate} → {edate}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {!isDashboardOrUpload && (
            <select
              aria-label="Select police station"
              className="search-trigger-btn"
              value={policeStationValue}
              onChange={(e) => {
                setLocalPoliceStation(e.target.value);
                setSelectedPoliceStation?.(e.target.value);
              }}
              style={{ cursor: "pointer" }}
            >
              <option value="">All Stations</option>
              {policeStations.map((station) => {
                const value = typeof station === "string" ? station : station.value;
                const label = typeof station === "string" ? station : station.label;

                return (
                  <option key={value} value={value}>
                    {label}
                  </option>
                );
              })}
            </select>
          )}

          <button
            className="search-trigger-btn"
            onClick={() => setShowSearch(true)}
          >
            🔍 Search By Date
          </button>
        </div>
      </div>

      {showSearch && (
        <div className="search-modal-overlay">
          <form
            className="search-form"
            onSubmit={handleSearchSubmit}
          >
            <h2>Search Records</h2>

            {/* Error message */}
            {dateError && (
              <div
                style={{
                  color: "#dc2626",
                  background: "#fee2e2",
                  padding: "10px",
                  marginBottom: "15px",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              >
                ⚠️ {dateError}
              </div>
            )}

            <div className="inputs">
              <label>From Date</label>

              <input
                type="date"
                value={tempSdate}
                max={today}
                onChange={(e) => {
                  setTempSdate(e.target.value);
                  setDateError("");
                }}
              />
            </div>

            <div className="inputs">
              <label>
                To Date <span style={{ color: "red" }}>*</span>
              </label>

              <input
                type="date"
                value={tempEdate}
                max={today}
                onChange={(e) => {
                  setTempEdate(e.target.value);
                  setDateError("");
                }}
                required
              />
            </div>

            <div className="btn-container">
              <button type="submit">
                SEARCH
              </button>

              <button
                type="button"
                onClick={handleClose}
              >
                CLOSE
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
