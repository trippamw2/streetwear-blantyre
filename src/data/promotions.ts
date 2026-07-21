export interface Promotion {
  id: string;
  title: string;
  subtitle: string;
  description?: string;
  image?: string;
  images?: string[];
  link: string;
  link_text: string;
  background_color: string;
  text_color: string;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  pages?: string[];
  created_at: string;
}