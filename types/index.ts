export interface Widget {
  litActionCode: string;
  reactCode: string;
  parameters: any[];
  previewData: any;
}

export interface Pin {
  id: string;
  title: string;
  tagline: string;
  lastUpdated: string;
  accentColor?: string;
  widget?: {
    litActionCode: string;
    reactCode: string;
    parameters: any[];
    previewData: any;
    userConfig?: Record<string, string>;
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
