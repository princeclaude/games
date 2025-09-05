import { useState } from 'react'

import { ToastProvider } from './context/ToastContext'

import Navigation from './Navigation';
import { useInvitations } from './context/InvitationContext';
import { useInviteSocket } from './hooks/useInviteSocket';





function App() {
  const { fetchInvitation } = useInvitations();
  useInviteSocket(fetchInvitation);
  
  return (
    <>
      

      <ToastProvider>
       
        <Navigation/>
        
      </ToastProvider>
    </>
  );
}

export default App
