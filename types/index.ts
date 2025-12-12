export interface Widget {
  litActionCode: string;
  reactCode: string;
  parameters: any[];
  previewData: any;
}

export interface Pin {
  id: string;

  handle: string;
  title: string;
  tagline: string;
  accentColor: string;
  lastUpdated: string;
  stats: {
    githubRepos?: number;
    githubStars?: number;
    followerCount?: number;
  };
  // Defines the single "Hero Widget" for this pin
  widget?: {
    litActionCode: string;
    reactCode: string;
    parameters: any[];
    previewData: any;
    userConfig?: Record<string, string>; // Saved parameter values
  };
}

export interface MiniAppEmbed {
  version: '1';
  imageUrl: string;
  button: {
    title: string;
    action: {
      type: 'launch_miniapp' | 'launch_frame';
      name: string;
      url: string;
      splashImageUrl?: string;
      splashBackgroundColor?: string;
    };
  };
}
