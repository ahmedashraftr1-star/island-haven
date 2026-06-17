export type UserRole = "freelancer" | "graduate" | "student" | "other";

export interface ExtraLink {
  label: string;
  url: string;
}

export interface PublicMember {
  id: number;
  fullName: string;
  role: UserRole;
  jobTitle: string;
  bio: string;
  avatarUrl: string | null;
  skills: string;
  phone?: string;
  portfolioUrl: string;
  linkedinUrl: string;
  behanceUrl: string;
  githubUrl: string;
  otherLinks: ExtraLink[];
  worksCount?: number;
}

export interface Work {
  id: number;
  userId: number;
  title: string;
  description: string;
  coverUrl: string | null;
  galleryUrls: string[];
  videoUrl: string;
  category: string;
  status: "draft" | "published";
  createdAt: string;
  authorName?: string;
  authorAvatarUrl?: string | null;
}

export interface WorkAuthor {
  id: number;
  fullName: string;
  role: string;
  avatarUrl: string | null;
}

export interface WorkListItem {
  work: Work;
  author: WorkAuthor;
}

export interface DailyPost {
  id: number;
  type: "tip" | "news" | "quote" | "story";
  title: string;
  body: string;
  imageUrl: string | null;
  publishedAt: string;
  createdAt: string;
}

export interface SiteContent {
  [key: string]: Record<string, string>;
}

export interface Numbers {
  members: number;
  works: number;
  events: number;
  bookings: number;
  courses: number;
  graduates: number;
}

export interface CurrentUser {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  jobTitle: string;
  bio: string;
  avatarUrl: string | null;
  skills: string;
  phone?: string;
  portfolioUrl: string;
  linkedinUrl: string;
  behanceUrl: string;
  githubUrl: string;
  otherLinks: ExtraLink[];
}
