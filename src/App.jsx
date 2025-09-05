import { useInvitations } from "./context/InvitationContext";
import { useInviteSocket } from "./hooks/useInviteSocket";
import { ToastProvider } from "./context/ToastContext";
import Navigation from "./Navigation";

function App() {
  const { fetchInvitation } = useInvitations();

  return (
    <ToastProvider>
      <InviteSocketWrapper fetchInvitation={fetchInvitation} />
      <Navigation />
    </ToastProvider>
  );
}

function InviteSocketWrapper({ fetchInvitation }) {
  useInviteSocket(fetchInvitation);
  return null; // this component just sets up the socket listener
}

export default App;
