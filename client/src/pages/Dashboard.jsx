import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import AgingSummaryTable from "../components/dashboard/AgingSummaryTable";
import CharacterModule from "../components/dashboard/CharacterModule";
import CombinedDashboardModule from "../components/dashboard/CombinedDashboardModule";
// import ComplaintModule from "../components/dashboard/ComplaintModule";
import getAuthConfig from "../functions/getAuthConfig";
import DateSearchHeader from "../components/dashboard/DateSearchHeader";



export default function Dashboard({
  showSearch, 
  setShowSearch,
  sdate,
  setSdate,
  edate,
  setEdate,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const typeParam = searchParams.get("type");
  const locParam = searchParams.get("loc");

  // Handle active component states: null (Overview), 'character', 'domestic', 'tenant', 'employee'
  const [activeModule, setActiveModule] = useState(null);
  const [activeFilter, setActiveFilter] = useState(null);


  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [policeStations, setPoliceStations] = useState([]);
  


  // Synchronize state with URL parameters
  useEffect(() => {
    if (
      typeParam &&
      ["character", "domestic", "tenant", "employee"].includes(typeParam)
    ) {
      setActiveModule(typeParam);
      setActiveFilter(locParam || null);
    } else {
      setActiveModule(null);
      setActiveFilter(null);
    }

    // console.log(" typeParam ", typeParam, "locParam ", locParam);
  }, [typeParam, locParam]);

  useEffect(() => {
    const dashboardTypes = ["character", "domestic", "tenant", "employee"];

    // The overview is rendered by CombinedDashboardModule. Do not call the
    // station-specific /dashboard endpoint with type=all or no type.
    if (!dashboardTypes.includes(typeParam)) {
      setLoading(false);
      setError("");
      return;
    }

  }, [typeParam]);

 

   useEffect(() => {
    let isActive = true;

    async function loadPoliceStations() {
      try {
        const response = await axios.get('/dashboard', {
          params: { type: 'character' },
          ...getAuthConfig(),
        });

        console.log(" dasbhoard data list ", response.data);
        const stations = (response.data?.stationRows || [])
          .filter((station) => !station.isTotal && station.pre_station_name)
          .map((station) => ({
            value: station.pre_station_code || station.pre_station_name,
            label: station.pre_station_name,
          }));
          console.log(" stations without active ", stations)
        if (isActive) {
          console.log(" stations without is active ", stations)
          setPoliceStations(stations);
        }
      } catch (e) {
        console.error('Unable to load police stations:', e);
      }
    }

    loadPoliceStations();

    console.log(" policeStations ", policeStations);
    return () => {
      isActive = false;
    };
  }, []);

  return (
    <>
      <Navbar />

      <div className="dashboard-container" style={{ padding: "20px 30px" }}>
        {/* ── DYNAMIC SUB-COMPONENT DISPLAY AREA ── */}
        <div
          className="main-content-display-area"
          style={{ marginTop: "12px" }}
        >
          <DateSearchHeader
           showSearch={showSearch}
           setShowSearch={setShowSearch}
               sdate={sdate}
            setSdate={setSdate}
            edate={edate}
            setEdate={setEdate}
          />
          {/* Landing Overview: Shows Metric Summary Cards & Aging Summary Table */}
          {!activeModule && (
            <>
              {loading && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    color: "#1e293b",
                  }}
                >
                  डेटा लोड हो रहा है...
                </div>
              )}
              {error && (
                <div
                  style={{ textAlign: "center", padding: "20px", color: "red" }}
                >
                  {error}
                </div>
              )}

              {!loading && !error && (
                <>
                  <CombinedDashboardModule activeFilter={activeFilter}   sdate={sdate} edate={edate}/>

                  <AgingSummaryTable  sdate={sdate} setSdate={setSdate} edate={edate} setEdate={setEdate} />
                </>
              )}
            </>
          )}

          {/* Module 1: Character (Contains the Satyapan Station Table) */}
          {activeModule && (
            <CharacterModule
              activeFilter={activeFilter}
              activeModule={activeModule}
              policeStations={policeStations}
              sdate={sdate}
              edate={edate}
            />
          )}
        </div>
      </div>
    </>
  );
}
