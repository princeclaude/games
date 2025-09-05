
const API_URL = import.meta.env.VITE_API_URL;

export const sendInvite = async ({ toUsername, gameName, type }) => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      console.warn("No token found in localStorage — user is not logged in");
      return {
        success: false,
        data: { message: "You must be logged in to send invites." },
      };
    }
    const API_URL = import.meta.env.VITE_API_URL;

    const res = await fetch(`${API_URL}/api/invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ toUsername, gameName, type }),
    });

    const data = await res.json();

    
    console.log("Invite response:", res.status, data);

    return {
      success: res.ok,
      data, 
    };
  } catch (error) {
    console.error("❌ Network or fetch error sending invite:", error);
    return {
      success: false,
      data: { message: "Network error — please check your connection." },
};
}
};