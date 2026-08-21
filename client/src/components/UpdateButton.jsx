import React, { useState } from "react";
import axios from "axios";
import { API_BASE } from '../config/env';


export default function UpdateButton(type,request_number) {
  const [updating, setUpdating] = useState(false);

  const handleUpdate = async () => {
    console.log(" type inside update button ", type, " request_number ", request_number);    
    if (updating) return;

    setUpdating(true);

    try {
      const response = await axios.get(`${API_BASE}/updateStatus`,{params:{type,request_number}});

      console.log("Update response:", response.data);

      // Your update-success logic here
    } catch (error) {
      console.error("Update failed:", error);
    } finally {
      // Spinner stops only after API response/error
      setUpdating(false);
    }
  };

  return (
    <button
      className={`update-btn ${updating ? "updating" : ""}`}
      onClick={handleUpdate}
      disabled={updating}
    >
      {updating ? (
        <>
          <span className="spinner"></span>
          <span>Updating...</span>
        </>
      ) : (
        <>
          <span className="calendar-icon">▣</span>
          <span>Update is Available</span>
        </>
      )}
    </button>
  );
}