export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string; // HTML or Markdown
  excerpt?: string;
  meta_title?: string;
  meta_description?: string;
  featured_image?: string;
  status: 'draft' | 'published' | 'archived';
  category_id?: string;
  created_at: string;
  updated_at: string;
  seo_score?: number;
  tags?: string[];
  lang: 'en' | 'tl';
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  type: 'material' | 'industry' | 'sign_type';
  description?: string;
  parent_id?: string;
}

export interface Keyword {
  id: string;
  keyword: string;
  volume?: number;
  difficulty?: number;
  intent?: 'informational' | 'transactional' | 'navigational';
  status: 'pending' | 'planned' | 'published';
  target_post_id?: string;
  created_at: string;
}


export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Setting {
  id: string;
  key: string;
  value: Json; // JSON
}

export interface ContactRequest {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  message?: string;
  source?: string;
  created_at: string;
}

export interface GenerationLog {
  id: string;
  prompt: string;
  model: string;
  result: string;
  tokens_used: number;
  created_at: string;
}
