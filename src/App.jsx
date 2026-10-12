import { useCallback, useEffect, useState } from "react";
import AuthPage from "./components/AuthPage";
import Header from "./components/Header";
import Results from "./components/Results";
import { restoreUser, signOut } from "./lib/supabase";

export default function App() {
  // undefined while the saved session is being checked, null when signed out
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    restoreUser().then(setUser);
  }, []);

  const handleSignOut = useCallback(() => {
    setUser(null);
    signOut();
  }, []);

  return (
    <div className="min-h-screen">
      {user !== null && <Header onSignOut={user ? handleSignOut : undefined} />}

      {user === null && <AuthPage onAuth={setUser} />}
      {user && <Results user={user} onSignedOut={handleSignOut} />}
    </div>
  );
}
