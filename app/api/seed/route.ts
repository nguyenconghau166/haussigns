import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Hardcoded Data from Components
const PRODUCTS = [
    {
        name: 'Acrylic Build-Up',
        description: '3D letters with smooth finish. Best for logos and brand names.',
        price: 'From ₱3,500',
        rating: 5,
        image: 'https://images.unsplash.com/photo-1542382156909-9ae37b3f56fd?q=80&w=2674&auto=format&fit=crop',
        tag: 'Best Seller',
    },
    {
        name: 'Stainless Steel',
        description: 'Gold or hairline finish. Rust-proof and elegant for outdoor use.',
        price: 'From ₱4,500',
        rating: 4.8,
        image: 'https://images.unsplash.com/photo-1616400619175-5beda3a17896?q=80&w=2574&auto=format&fit=crop',
        tag: 'Premium',
    },
    {
        name: 'Neon LED Signs',
        description: 'Vibrant custom shapes and colors. Perfect for cafes and bars.',
        price: 'From ₱2,800',
        rating: 4.9,
        image: 'https://images.unsplash.com/photo-1563291074-2bf8677ac0e5?q=80&w=2548&auto=format&fit=crop',
        tag: 'Trending',
    },
    {
        name: 'Panaflex Lightbox',
        description: 'Cost-effective illuminated signage for large formats.',
        price: 'From ₱1,500',
        rating: 4.7,
        image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2670&auto=format&fit=crop',
        tag: 'Economy',
    },
];

const SERVICES = [
    {
        title: 'Acrylic Build-Up',
        description: 'Sleek, modern 3D letters perfect for indoor malls and corporate offices.',
        icon_name: 'Type',
        slug: 'acrylic-signage',
        gradient: 'from-blue-500 to-cyan-400',
        bg: 'bg-blue-500/10',
    },
    {
        title: 'Stainless Steel',
        description: 'Durable, premium look with Gold, Mirror, or Hairline finish. Weather-proof.',
        icon_name: 'Hammer',
        slug: 'stainless-steel',
        gradient: 'from-amber-500 to-yellow-400',
        bg: 'bg-amber-500/10',
    },
    {
        title: 'LED Neon Lights',
        description: 'Vibrant, eye-catching neons for bars, cafes, and creative spaces.',
        icon_name: 'Zap',
        slug: 'neon-lights',
        gradient: 'from-purple-500 to-pink-400',
        bg: 'bg-purple-500/10',
    },
    {
        title: 'Panaflex Lightbox',
        description: 'Cost-effective illuminated signage for large outdoor displays.',
        icon_name: 'Lightbulb',
        slug: 'panaflex',
        gradient: 'from-orange-500 to-red-400',
        bg: 'bg-orange-500/10',
    },
    {
        title: 'Building Identity',
        description: 'Large-scale pylon and building markers for maximum visibility.',
        icon_name: 'Building',
        slug: 'building-identity',
        gradient: 'from-slate-500 to-slate-400',
        bg: 'bg-slate-500/10',
    },
    {
        title: 'Wall Murals',
        description: 'Custom printed wallpapers and vinyl stickers for interior branding.',
        icon_name: 'PaintBucket',
        slug: 'wall-murals',
        gradient: 'from-emerald-500 to-teal-400',
        bg: 'bg-emerald-500/10',
    },
];

// NOTE: Testimonials and Projects were empty in the original code, but we can seed them with dummy data to verify visualization if desired, or leave empty.
// I will start with Products and Services as they are critical.

export async function GET() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        // Seed Products
        const { error: productsError } = await supabase.from('products').upsert(PRODUCTS, { onConflict: 'name' });
        if (productsError) throw productsError;

        // Seed Services
        const { error: servicesError } = await supabase.from('services').upsert(SERVICES, { onConflict: 'slug' });
        if (servicesError) throw servicesError;

        return NextResponse.json({ success: true, message: 'Data seeded successfully' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
