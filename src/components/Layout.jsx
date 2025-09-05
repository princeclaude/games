
import BottomNav from "./BottomNav";
import SidebarNav from "./SidebarNav";

const Layout = ({ children, invitationCount = 0 }) => {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-purple-800 to-black text-white">
      
      <aside className="hidden md:block sidebar-animate">
        <SidebarNav invitationCount={invitationCount} />
      </aside>

      
      <main className="flex-1 p-4 pb-20 md:pb-4 overflow-y-auto">
        {children}
      </main>

      
      <div className="block md:hidden fixed bottom-0 left-0 w-full bottomnav-animate">
        <BottomNav invitationCount={invitationCount} />
      </div>
    </div>
  );
};

export default Layout;
