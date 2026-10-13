export type Profile = {
  id: string;
  user_id: string | null;
  name: string;
  slug: string;
  title: string | null;
  grade: string | null;
  bio: string | null;
  photo_url: string | null;
  is_admin: boolean;
  active: boolean;
  sort_order: number;
};

export type PostStatus = "draft" | "published";

export type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  cover_url: string | null;
  tags: string[];
  status: PostStatus;
  published_at: string | null;
  emailed_at: string | null;
  author_id: string | null;
  /** Overrides the author name, for posts written by members who aren't officers. */
  byline: string | null;
  created_at: string;
  updated_at: string;
  author?: Pick<Profile, "name" | "slug" | "title" | "photo_url"> | null;
};

export type ClubEvent = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  link: string | null;
};
