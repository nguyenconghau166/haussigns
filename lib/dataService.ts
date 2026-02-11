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
async function fetchData<T>(table: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: true });

    if (error) {
        console.error(`Error fetching ${table}:`, error);
        return [];
    }

    return data as T[];
}

export const getProducts = async () => fetchData<any>('products');
export const getTestimonials = async () => fetchData<any>('testimonials');
export const getProjects = async () => fetchData<any>('projects');
export const getServices = async () => fetchData<any>('services');
