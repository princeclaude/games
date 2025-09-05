
import InvitationsList from "../components/InvitationList";
import Layout from "../components/Layout";

const Expect = () => {
  return (
    <Layout>
      <div className="space-y-3 bg-gradient-to-br from-purple-800 to-black p-4 text-white">
        <header className="p-4 text-center font-bold text-white text-lg sticky top-0 bg-shadow-sm">
          Invitations
        </header>
        <InvitationsList />
      </div>
    </Layout>
  );
};

export default Expect;
