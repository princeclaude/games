import { useInvitations } from "./context/InvitationContext";
import { useInviteSocket } from "./hooks/useInviteSocket";
import { ToastProvider } from "./context/ToastContext";
import Navigation from "./Navigation";

function App() {
  const { fetchInvitation } = useInvitations();

  return (
    <ToastProvider>
      
      {useInviteSocket(fetchInvitation)}
      <Navigation />
    </ToastProvider>
  );
}

export default App;
