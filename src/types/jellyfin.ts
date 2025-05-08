
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
  MediaSources?: JellyfinMediaSource[];
}

export interface JellyfinMediaSource {
  Id: string;
  Name?: string;
  Container?: string;
  MediaStreams?: JellyfinMediaStream[];
  SupportsDirectPlay?: boolean;
  SupportsDirectStream?: boolean;
  SupportsTranscoding?: boolean;
  SupportsProbing?: boolean;
}

export interface JellyfinMediaStream {
  Type: string; // Audio, Video, Subtitle
  Index: number;
  Codec: string;
  Language?: string;
  IsDefault?: boolean;
  DisplayTitle?: string;
}

export interface JellyfinSearchResult {
  Items: JellyfinMediaItem[];
  TotalRecordCount: number;
}

export interface PlaybackOptions {
  startTimeTicks?: number;
  audioStreamIndex?: number;
  subtitleStreamIndex?: number;
  maxStreamingBitrate?: number;
  maxWidth?: number;
  maxHeight?: number;
  enableTranscoding?: boolean;
}

export interface BitrateTestResult {
  bitrate: number;
  isComplete: boolean;
}
