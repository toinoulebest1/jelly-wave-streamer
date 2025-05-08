import { toast } from "sonner";
import { 
  JellyfinAuthResponse, 
  JellyfinCredentials, 
  JellyfinLibrary, 
  JellyfinMediaItem, 
  JellyfinSearchResult, 
  JellyfinUser, 
  PlaybackOptions,
  BitrateTestResult 
} from "../types/jellyfin";

class JellyfinService {
  private serverUrl: string = '';
  private apiKey: string = '';
  private userId: string = '';
  private deviceId: string = 'lovable-jellyfin-app';
  private clientVersion: string = '1.0.0';
  private deviceName: string = 'Lovable Web Client';

  constructor() {
    // Vérifier si nous avons des informations de connexion stockées
    const storedServerUrl = localStorage.getItem('jellyfinServerUrl');
    const storedApiKey = localStorage.getItem('jellyfinApiKey');
    const storedUserId = localStorage.getItem('jellyfinUserId');
    
    if (storedServerUrl) this.serverUrl = storedServerUrl;
    if (storedApiKey) this.apiKey = storedApiKey;
    if (storedUserId) this.userId = storedUserId;
  }

  get isConnected(): boolean {
    return !!(this.serverUrl && this.apiKey && this.userId);
  }

  get baseUrl(): string {
    return this.serverUrl;
  }

  private getHeaders() {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-Emby-Authorization': `MediaBrowser Client="Lovable", Device="${this.deviceName}", DeviceId="${this.deviceId}", Version="${this.clientVersion}"`,
    };

    if (this.apiKey) {
      headers['X-Emby-Token'] = this.apiKey;
    }

    return headers;
  }

  async connect(credentials: JellyfinCredentials): Promise<boolean> {
    try {
      this.serverUrl = credentials.serverUrl.trim();
      
      // If server URL doesn't start with http(s), add it
      if (!this.serverUrl.startsWith('http')) {
        this.serverUrl = `http://${this.serverUrl}`;
      }
      
      // Remove trailing slash if present
      if (this.serverUrl.endsWith('/')) {
        this.serverUrl = this.serverUrl.slice(0, -1);
      }

      // If we have an API key, use that directly
      if (credentials.apiKey) {
        this.apiKey = credentials.apiKey;
        
        // Test connection with API key
        const user = await this.getCurrentUser();
        if (user) {
          this.userId = user.Id;
          
          // Store connection info
          localStorage.setItem('jellyfinServerUrl', this.serverUrl);
          localStorage.setItem('jellyfinApiKey', this.apiKey);
          localStorage.setItem('jellyfinUserId', this.userId);
          
          toast.success("Connecté avec succès au serveur Jellyfin");
          return true;
        }
        return false;
      } 
      
      // Otherwise try to authenticate with username/password
      else if (credentials.username && credentials.password) {
        const response = await fetch(`${this.serverUrl}/Users/AuthenticateByName`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            Username: credentials.username,
            Pw: credentials.password,
          }),
        });

        if (!response.ok) {
          throw new Error(`Échec de l'authentification: ${response.status}`);
        }

        const data: JellyfinAuthResponse = await response.json();
        this.apiKey = data.AccessToken;
        this.userId = data.User.Id;

        // Store connection info
        localStorage.setItem('jellyfinServerUrl', this.serverUrl);
        localStorage.setItem('jellyfinApiKey', this.apiKey);
        localStorage.setItem('jellyfinUserId', this.userId);
        
        toast.success("Connecté avec succès au serveur Jellyfin");
        return true;
      }
      
      throw new Error("Informations d'identification insuffisantes");
    } catch (error) {
      console.error("Erreur de connexion à Jellyfin:", error);
      toast.error(`Erreur de connexion: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      return false;
    }
  }

  disconnect(): void {
    this.serverUrl = '';
    this.apiKey = '';
    this.userId = '';
    localStorage.removeItem('jellyfinServerUrl');
    localStorage.removeItem('jellyfinApiKey');
    localStorage.removeItem('jellyfinUserId');
    toast.info("Déconnecté du serveur Jellyfin");
  }

  async getCurrentUser(): Promise<JellyfinUser | null> {
    try {
      if (!this.isConnected) return null;

      const response = await fetch(`${this.serverUrl}/Users/Me`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Échec de la récupération de l'utilisateur: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Erreur lors de la récupération de l'utilisateur:", error);
      return null;
    }
  }

  async getLibraries(): Promise<JellyfinLibrary[]> {
    try {
      if (!this.isConnected) return [];

      const response = await fetch(`${this.serverUrl}/Users/${this.userId}/Views`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Échec de la récupération des bibliothèques: ${response.status}`);
      }

      const data = await response.json();
      return data.Items || [];
    } catch (error) {
      console.error("Erreur lors de la récupération des bibliothèques:", error);
      return [];
    }
  }

  async getItems(parentId: string, options: { 
    limit?: number;
    startIndex?: number;
    filters?: string;
    sortBy?: string;
    sortOrder?: 'Ascending' | 'Descending';
    recursive?: boolean;
  } = {}): Promise<JellyfinMediaItem[]> {
    try {
      if (!this.isConnected) return [];

      const params = new URLSearchParams({
        ParentId: parentId,
        Limit: options.limit?.toString() || '50',
        StartIndex: options.startIndex?.toString() || '0',
        SortBy: options.sortBy || 'SortName',
        SortOrder: options.sortOrder || 'Ascending',
        Recursive: options.recursive?.toString() || 'false',
      });

      if (options.filters) {
        params.append('Filters', options.filters);
      }

      const response = await fetch(`${this.serverUrl}/Users/${this.userId}/Items?${params.toString()}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Échec de la récupération des médias: ${response.status}`);
      }

      const data = await response.json();
      return data.Items || [];
    } catch (error) {
      console.error("Erreur lors de la récupération des médias:", error);
      return [];
    }
  }

  async getLatestMedia(parentId?: string): Promise<JellyfinMediaItem[]> {
    try {
      if (!this.isConnected) return [];

      const params = new URLSearchParams({
        Limit: '20',
        Fields: 'PrimaryImageAspectRatio,Overview',
      });

      if (parentId) {
        params.append('ParentId', parentId);
      }

      const response = await fetch(`${this.serverUrl}/Users/${this.userId}/Items/Latest?${params.toString()}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Échec de la récupération des médias récents: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Erreur lors de la récupération des médias récents:", error);
      return [];
    }
  }

  async getResumeItems(): Promise<JellyfinMediaItem[]> {
    try {
      if (!this.isConnected) return [];

      const response = await fetch(`${this.serverUrl}/Users/${this.userId}/Items/Resume?Limit=10`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Échec de la récupération des médias en cours: ${response.status}`);
      }

      const data = await response.json();
      return data.Items || [];
    } catch (error) {
      console.error("Erreur lors de la récupération des médias en cours:", error);
      return [];
    }
  }

  async getItemDetails(itemId: string): Promise<JellyfinMediaItem | null> {
    try {
      if (!this.isConnected || !itemId) return null;

      const response = await fetch(`${this.serverUrl}/Users/${this.userId}/Items/${itemId}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Échec de la récupération des détails: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Erreur lors de la récupération des détails pour l'item ${itemId}:`, error);
      return null;
    }
  }

  async search(query: string): Promise<JellyfinSearchResult> {
    try {
      if (!this.isConnected || !query) {
        return { Items: [], TotalRecordCount: 0 };
      }

      const params = new URLSearchParams({
        SearchTerm: query,
        Limit: '50',
        IncludeItemTypes: 'Movie,Series,Episode',
        Fields: 'PrimaryImageAspectRatio,Overview',
      });

      const response = await fetch(`${this.serverUrl}/Users/${this.userId}/Items?${params.toString()}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Échec de la recherche: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Erreur lors de la recherche:", error);
      return { Items: [], TotalRecordCount: 0 };
    }
  }

  getImageUrl(itemId: string, imageTag: string, imageType: string = 'Primary', width?: number, height?: number): string {
    if (!this.isConnected || !itemId || !imageTag) {
      return '/placeholder.svg';
    }
    
    const params = new URLSearchParams({
      tag: imageTag,
    });
    
    if (width) params.append('width', width.toString());
    if (height) params.append('height', height.toString());
    
    return `${this.serverUrl}/Items/${itemId}/Images/${imageType}?${params.toString()}`;
  }

  getBackdropUrl(itemId: string, imageTag: string, width?: number): string {
    if (!this.isConnected || !itemId || !imageTag) {
      return '/placeholder.svg';
    }
    
    const params = new URLSearchParams({
      tag: imageTag,
    });
    
    if (width) params.append('width', width.toString());
    
    return `${this.serverUrl}/Items/${itemId}/Images/Backdrop?${params.toString()}`;
  }

  // Test de débit pour optimiser la qualité de streaming
  async testBitrate(size: number = 1000000): Promise<BitrateTestResult> {
    if (!this.isConnected) {
      return { bitrate: 8000000, isComplete: false }; // Valeur par défaut 8 Mbps
    }

    try {
      const url = `${this.serverUrl}/Playback/BitrateTest?Size=${size}`;
      console.log(`Requesting ${url}`);
      
      const startTime = performance.now();
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Erreur lors du test de débit: ${response.status}`);
      }

      const buffer = await response.arrayBuffer();
      const endTime = performance.now();
      const duration = (endTime - startTime) / 1000; // en secondes
      const bytes = buffer.byteLength;
      
      // Calcul du débit en bits par seconde (bps)
      const bitsLoaded = bytes * 8;
      const bitrate = Math.round(bitsLoaded / duration);
      
      console.log(`BitrateTest ${bytes} bytes loaded (${size} requested) in ${duration} seconds -> ${bitrate} bps`);
      
      return {
        bitrate,
        isComplete: duration < 5 && bytes >= size // Le test est complet si la durée est raisonnable
      };
    } catch (error) {
      console.error('Erreur lors du test de débit:', error);
      return { bitrate: 8000000, isComplete: false }; // Valeur par défaut en cas d'erreur
    }
  }

  getStreamUrl(itemId: string, options: PlaybackOptions = {}): string {
    if (!this.isConnected || !itemId) return '';
    
    const uniquePlaySessionId = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    const params = new URLSearchParams({
      DeviceId: this.deviceId,
      MediaSourceId: itemId,
      api_key: this.apiKey,
      PlaySessionId: uniquePlaySessionId,
    });
    
    if (options.startTimeTicks) {
      params.append('startTimeTicks', options.startTimeTicks.toString());
    }
    
    if (options.audioStreamIndex !== undefined) {
      params.append('AudioStreamIndex', options.audioStreamIndex.toString());
    }
    
    if (options.subtitleStreamIndex !== undefined) {
      params.append('SubtitleStreamIndex', options.subtitleStreamIndex.toString());
    }
    
    if (options.enableTranscoding) {
      // Ajout des paramètres de transcodage
      params.append('VideoCodec', 'h264');
      params.append('AudioCodec', 'aac');
      
      if (options.maxStreamingBitrate) {
        params.append('VideoBitrate', options.maxStreamingBitrate.toString());
        params.append('AudioBitrate', '384000'); // 384 kbps pour l'audio
      }
      
      if (options.maxWidth) {
        params.append('MaxWidth', options.maxWidth.toString());
      }
      
      if (options.maxHeight) {
        params.append('MaxHeight', options.maxHeight.toString());
      }
      
      // Paramètres supplémentaires pour un meilleur transcodage
      params.append('SubtitleMethod', 'Encode');
      params.append('TranscodingMaxAudioChannels', '2');
      params.append('RequireAvc', 'true');
      params.append('h264-level', '42');
      params.append('h264-profile', 'high');
      params.append('TranscodeReasons', 'ContainerNotSupported,VideoCodecNotSupported,AudioCodecNotSupported');
      
      return `${this.serverUrl}/videos/${itemId}/master.m3u8?${params.toString()}`;
    }
    
    // Lecture directe (sans transcodage)
    return `${this.serverUrl}/Videos/${itemId}/stream?static=true&${params.toString()}`;
  }

  formatRuntime(runtimeTicks?: number): string {
    if (!runtimeTicks) return 'N/A';
    
    // Jellyfin uses "ticks" (100-nanosecond units)
    const seconds = runtimeTicks / 10000000;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  }

  // Ajouter une méthode pour obtenir les détails de streaming d'un média
  async getPlaybackInfo(itemId: string): Promise<any> {
    try {
      if (!this.isConnected || !itemId) return null;
      
      const response = await fetch(`${this.serverUrl}/Items/${itemId}/PlaybackInfo`, {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`Échec de la récupération des infos de lecture: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Erreur lors de la récupération des infos de lecture pour l'item ${itemId}:`, error);
      return null;
    }
  }
}

export const jellyfinService = new JellyfinService();
