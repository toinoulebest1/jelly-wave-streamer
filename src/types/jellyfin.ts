
export interface JellyfinCredentials {
  serverUrl: string;
  username?: string;
  password?: string;
  apiKey?: string;
}

export interface JellyfinAuthResponse {
  User: {
    Id: string;
    Name: string;
  };
  AccessToken: string;
  ServerId: string;
}

export interface JellyfinUser {
  Id: string;
  Name: string;
  PrimaryImageTag?: string;
}

export interface JellyfinLibrary {
  Id: string;
  Name: string;
  Type: string;
  CollectionType: string;
  ImageTagsPrimary?: {
    Primary?: string;
  };
}

export interface JellyfinMediaItem {
  Id: string;
  Name: string;
  Type: string;
  ImageTags?: {
    Primary?: string;
  };
  BackdropImageTags?: string[];
  Overview?: string;
  Genres?: string[];
  ProductionYear?: number;
  RunTimeTicks?: number;
  OfficialRating?: string;
  CommunityRating?: number;
  MediaType?: string;
  SeriesName?: string;
  UserData?: {
    PlaybackPositionTicks?: number;
    PlayedPercentage?: number;
    Played?: boolean;
    IsFavorite?: boolean;
  };
}

export interface JellyfinSearchResult {
  Items: JellyfinMediaItem[];
  TotalRecordCount: number;
}
