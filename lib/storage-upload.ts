import { supabaseAdmin } from './supabase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Uploads an image from a URL or Base64 string to Supabase Storage.
 * @param imageUrl The URL or Base64 data of the image.
 * @param bucket The storage bucket name (default: 'images').
 * @returns The public URL of the uploaded image.
 */
export async function uploadImageFromUrl(imageUrl: string, bucket: string = 'images'): Promise<string | null> {
    try {
        let buffer: Buffer;
        let contentType = 'image/png'; // Default
        const fileName = `${uuidv4()}.png`;

        // Check if Base64
        if (imageUrl.startsWith('data:')) {
            const matches = imageUrl.match(/^data:(.+);base64,(.+)$/);
            if (!matches) {
                throw new Error('Invalid Base64 string');
            }
            contentType = matches[1];
            buffer = Buffer.from(matches[2], 'base64');
        } else {
            // Fetch from URL
            const response = await fetch(imageUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.statusText}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);

            const type = response.headers.get('content-type');
            if (type) contentType = type;

            // Update extension based on content type if needed, strict check not always required for storage
        }

        // Upload to Supabase
        const { data, error } = await supabaseAdmin.storage
            .from(bucket)
            .upload(fileName, buffer, {
                contentType: contentType,
                upsert: false
            });

        if (error) {
            console.error('Supabase Storage Upload Error:', error);
            throw error;
        }

        // Get Public URL
        const { data: publicUrlData } = supabaseAdmin.storage
            .from(bucket)
            .getPublicUrl(fileName);

        return publicUrlData.publicUrl;

    } catch (error) {
        console.error('Error in uploadImageFromUrl:', error);
        return null;
    }
}
