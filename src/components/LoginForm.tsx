
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { jellyfinService } from '@/services/jellyfinService';
import { JellyfinCredentials } from '@/types/jellyfin';

interface LoginFormProps {
  onLoginSuccess: () => void;
}

const LoginForm = ({ onLoginSuccess }: LoginFormProps) => {
  const [loading, setLoading] = useState(false);
  const [serverUrl, setServerUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const credentials: JellyfinCredentials = {
        serverUrl,
        username,
        password,
      };
      
      const success = await jellyfinService.connect(credentials);
      if (success) {
        onLoginSuccess();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApiKeyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const credentials: JellyfinCredentials = {
        serverUrl,
        apiKey,
      };
      
      const success = await jellyfinService.connect(credentials);
      if (success) {
        onLoginSuccess();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-jellyfin-dark-card border-jellyfin-primary/20">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Jellyfin Streamer</CardTitle>
        <CardDescription className="text-center">
          Connectez-vous à votre serveur Jellyfin
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="credentials">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="credentials">Identifiants</TabsTrigger>
            <TabsTrigger value="apikey">Clé API</TabsTrigger>
          </TabsList>
          
          <TabsContent value="credentials">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="server-url">URL du serveur</Label>
                <Input 
                  id="server-url" 
                  placeholder="http://votre-serveur:8096" 
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Nom d'utilisateur</Label>
                <Input 
                  id="username" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-jellyfin-primary hover:bg-jellyfin-secondary" 
                disabled={loading}
              >
                {loading ? "Connexion en cours..." : "Se connecter"}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="apikey">
            <form onSubmit={handleApiKeyLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="server-url-api">URL du serveur</Label>
                <Input 
                  id="server-url-api" 
                  placeholder="http://votre-serveur:8096" 
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="api-key">Clé API</Label>
                <Input 
                  id="api-key" 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required 
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-jellyfin-primary hover:bg-jellyfin-secondary" 
                disabled={loading}
              >
                {loading ? "Connexion en cours..." : "Se connecter"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default LoginForm;
