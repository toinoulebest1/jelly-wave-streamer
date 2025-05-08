
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "@/components/LoginForm";
import { jellyfinService } from "@/services/jellyfinService";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [isConnected, setIsConnected] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté
    const checkConnection = async () => {
      if (jellyfinService.isConnected) {
        const user = await jellyfinService.getCurrentUser();
        if (user) {
          setIsConnected(true);
        }
      }
    };

    checkConnection();
  }, []);

  const handleLoginSuccess = () => {
    setIsConnected(true);
    navigate("/home");
  };

  const handleLogout = () => {
    jellyfinService.disconnect();
    setIsConnected(false);
  };

  if (isConnected) {
    navigate("/home");
  }

  return (
    <div className="min-h-screen bg-jellyfin-dark flex flex-col">
      <header className="py-6 px-4 flex justify-center">
        <h1 className="text-3xl font-bold">
          <span className="text-jellyfin-primary">Jellyfin</span> Streamer
        </h1>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full mx-auto">
          {isConnected ? (
            <div className="text-center">
              <h2 className="text-2xl font-medium mb-4">Vous êtes connecté</h2>
              <div className="flex flex-col gap-4">
                <Button 
                  className="w-full bg-jellyfin-primary hover:bg-jellyfin-secondary"
                  onClick={() => navigate("/home")}
                >
                  Accéder à ma médiathèque
                </Button>
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={handleLogout}
                >
                  Se déconnecter
                </Button>
              </div>
            </div>
          ) : (
            <LoginForm onLoginSuccess={handleLoginSuccess} />
          )}
        </div>
      </main>

      <footer className="py-6 text-center text-gray-500 text-sm">
        <p>Application Jellyfin non officielle - Construite avec Lovable</p>
      </footer>
    </div>
  );
};

export default Index;
