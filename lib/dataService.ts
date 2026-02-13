import { createClient } from '@supabase/supabase-js';
import { cache } from 'react';

// Initialize Supabase Client for Server-Side Fetching
// We use cache() to deduplicate requests in the same render cycle
export const getSupabase = cache(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createClient(supabaseUrl, supabaseKey);
});

// Generic fetch function
async function fetchData<T>(table: string, limit?: number) {
    const supabase = getSupabase();
    let query = supabase.from(table).select('*').order('created_at', { ascending: false }); // Changed to DESC for latest items

    if (limit) {
        query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
        console.error(`Error fetching ${table}:`, error);
        return [];
    }

    return data as T[];
}

export const getProducts = async (limit?: number) => fetchData<any>('products', limit);
export const getTestimonials = async (limit?: number) => fetchData<any>('testimonials', limit);
export const getProjects = async (limit?: number) => fetchData<any>('projects', limit);
export const getServices = async (limit?: number) => fetchData<any>('services', limit);
export const getPosts = async (limit?: number) => fetchData<any>('posts', limit);

export const getServiceBySlug = async (slug: string) => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('services').select('*').eq('slug', slug).single();
    if (error) {
        console.error(`Error fetching service ${slug}:`, error);
        return null;
    }
    return data;
};
