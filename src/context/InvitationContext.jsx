import { useEffect, useState } from "react";

export const useInvitations = () => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInvitations = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No token found, skipping invitation fetch.");
        setLoading(false);
        return;
      }

      const res = await fetch("http://localhost:5000/api/invite", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Fetch invitations status:", res.status);
      console.log("Fetch invitations content-type:", res.headers.get("content-type"));

      // If response is not JSON, log the raw text and return early
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Expected JSON but got:", text);
        setLoading(false);
        return;
      }

      const data = await res.json();
      console.log("✅ Invitations response data:", data);

      if (res.ok) {
        setInvitations(data.data || []);
      } else {
        console.error("❌ Error from backend:", data.message);
      }
    } catch (error) {
      console.error("🔥 Network or parsing error fetching invitations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
    const interval = setInterval(fetchInvitations, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  return { invitations, loading, fetchInvitations };
};