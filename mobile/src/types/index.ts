export interface User {
  id: string;
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  password?: string;
  profileImage: string;
  coverImage: string;
  bio: string;
  friends: string[];
  createdAt: string;
  walletBalance: string;
  roles?: string[];
  packageactive: boolean;
  packageName: string;
  referral: string;
}

export interface Post {
  id: string;
  userId: string;
  author: User; // The author of the post
  content: string;
  images: string[];
  videos: string[];
  likes: string[];
  comments: Comment[];
  createdAt: string;
  live?: {
    isLive: boolean;
    channelId?: string;
    viewers?: number;
  } | null;
  [key: string]: any; // Allow loose typing for API flexibility
}

export interface Comment {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface StoryItem {
  id: string;
  type: "image" | "video" | "text";
  url: string;
  meta?: any;
  created_at?: string;
}

export interface Story {
  userId: string;
  username: string;
  avatar: string;
  stories: StoryItem[];
}
