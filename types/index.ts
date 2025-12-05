export type Fid = number;

export type WidgetType = 'programmable';

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  code: string; // Raw React component code
  order: number;
}

export interface Pin {
  fid: Fid;
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
  widgets: Widget[];
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
