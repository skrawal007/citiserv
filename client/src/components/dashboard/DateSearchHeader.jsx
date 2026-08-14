// import React from "react";

// export default function DateSearchHeader({
//   title,
//   showSearch,
//   setShowSearch,
//   sdate,
//   setSdate,
//   edate,
//   setEdate,
//   // handleSearchSubmit,
// }) {

//     function handleSearchSubmit(e) {
//     e.preventDefault();
//     if (!sdate || !edate) {
//       alert('कृपया दोनों दिनांक भरें');
//       return;
//     }
//     console.log("handaleSearchSubmti sdate ",sdate, " edate ", edate );
//     // loadStationData(sdate, edate);
//     setShowSearch(false);
//   }

//   return (
//     <div className="module-container card-upgrade" style={{ padding: "20px" }}>
//       <div
//         className="module-header"
//         style={{
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//           marginBottom: "16px",
//         }}
//       >
//         <div className="module-title-group">
//           <h2
//             style={{
//               fontSize: "20px",
//               color: "#1e293b",
//               margin: 0,
//             }}
//           >
//             {title}
//           </h2>
//         </div>

//         <button
//           className="search-trigger-btn"
//           onClick={() => setShowSearch(true)}
//         >
//           🔍 दिनांक द्वारा खोजें
//         </button>
//       </div>

//       {showSearch && (
//         <div className="search-modal-overlay">
//           <form className="search-form" onSubmit={handleSearchSubmit}>
//             <h2>Search Records</h2>

//             <div className="inputs">
//               <label>From Date</label>

//               <input
//                 type="date"
//                 value={sdate}
//                 onChange={(e) => setSdate(e.target.value)}
//               />
//             </div>

//             <div className="inputs">
//               <label>
//                 To Date <span style={{ color: "red" }}>*</span>
//               </label>

//               <input
//                 type="date"
//                 value={edate}
//                 onChange={(e) => setEdate(e.target.value)}
//                 required
//               />
//             </div>

//             <div className="btn-container">
//               <button type="submit">SEARCH</button>

//               <button type="button" onClick={() => setShowSearch(false)}>
//                 CLOSE
//               </button>
//             </div>
//           </form>
//         </div>
//       )}
//     </div>
//   );
// }



import React from "react";

export default function DateSearchHeader({
  showSearch,
  setShowSearch,
  sdate,
  setSdate,
  edate,
  setEdate,
}) {
  function handleSearchSubmit(e) {
    e.preventDefault();

    if (!sdate || !edate) {
      alert("कृपया दोनों दिनांक भरें");
      return;
    }

    console.log(
      "handleSearchSubmit sdate:",
      sdate,
      "edate:",
      edate
    );

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
      

          {/* Date shown instead of the shield/title text */}
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

        <button
          className="search-trigger-btn"
          onClick={() => setShowSearch(true)}
        >
          🔍 दिनांक द्वारा खोजें
        </button>
      </div>

      {showSearch && (
        <div className="search-modal-overlay">
          <form
            className="search-form"
            onSubmit={handleSearchSubmit}
          >
            <h2>Search Records</h2>

            <div className="inputs">
              <label>From Date</label>

              <input
                type="date"
                value={sdate}
                onChange={(e) => setSdate(e.target.value)}
              />
            </div>

            <div className="inputs">
              <label>
                To Date <span style={{ color: "red" }}>*</span>
              </label>

              <input
                type="date"
                value={edate}
                onChange={(e) => setEdate(e.target.value)}
                required
              />
            </div>

            <div className="btn-container">
              <button type="submit">SEARCH</button>

              <button
                type="button"
                onClick={() => setShowSearch(false)}
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
