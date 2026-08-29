import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { AuthProvider } from "./context/AuthContext";
import { QueueProvider } from "./context/QueueContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Characters from "./pages/Characters";
import Detail from "./pages/Detail";

export default function App() {
  const getDateString = (date) => {
    return date.toISOString().split("T")[0];
  };

  const today = new Date();

  const oneMonthAgo = new Date(today);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const [sdate, setSdate] = useState(getDateString(oneMonthAgo));
  const [edate, setEdate] = useState(getDateString(today));
  const [showSearch, setShowSearch] = useState(false);
  
  return (
    <AuthProvider>
      <QueueProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard
                  showSearch={showSearch}
                  setShowSearch={setShowSearch}
                  sdate={sdate}
                  setSdate={setSdate}
                  edate={edate}
                  setEdate={setEdate}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <Upload />
              </ProtectedRoute>
            }
          />
          <Route
            path="/characters"
            element={
              <ProtectedRoute>
                <Characters  
                  showSearch={showSearch}
                  setShowSearch={setShowSearch}
                  sdate={sdate}
                  setSdate={setSdate}
                  edate={edate}
                  setEdate={setEdate}/>
              </ProtectedRoute>
            }
          />
          <Route
            path="/detail"
            element={
              <ProtectedRoute>
                <Detail />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      </QueueProvider>
    </AuthProvider>
  );
}
