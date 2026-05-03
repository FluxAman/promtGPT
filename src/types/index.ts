export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  created_at: string;
  prompt_count?: number;
}

export interface Prompt {
  id: string;
  title: string;
  prompt_text: string;
  image_url: string;
  category_id: string | null;
  tags: string[];
  copy_count: number;
  created_by: string | null;
  is_featured: boolean;
  created_at: string;
  category?: Category;
}

export interface SavedPrompt {
  id: string;
  user_id: string;
  prompt_id: string;
  created_at: string;
  prompt?: Prompt;
}

export interface UserProfile {
  id: string;
  email: string | null;
  avatar_url: string | null;
  full_name: string | null;
}

export interface SearchParams {
  q?: string;
  category?: string;
  sort?: "newest" | "most_copied";
  page?: string;
}
