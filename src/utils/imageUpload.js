/**
 * Image Upload Utility
 * Uploads images to Supabase Storage
 */
import { supabase } from '../supabaseClient';

/**
 * Upload an image file to Supabase Storage
 * @param {File} file - The image file to upload
 * @param {string} userId - The user ID (for organizing files)
 * @returns {Promise<string>} - The public URL of the uploaded image
 */
export async function uploadImage(file, userId) {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('Image must be less than 5MB');
    }

    // Create a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `item-images/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('item-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading image:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('item-images')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get image URL');
    }

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadImage:', error);
    throw error;
  }
}

/**
 * Upload a profile picture to Supabase Storage
 * @param {File} file - The image file to upload
 * @param {string} userId - The user ID
 * @returns {Promise<string>} - The public URL of the uploaded image
 */
export async function uploadProfilePicture(file, userId) {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('Image must be less than 5MB');
    }

    // Create a unique filename for profile picture
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/profile_${Date.now()}.${fileExt}`;
    const filePath = fileName; // Path relative to bucket root

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('profile-pictures')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true, // Allow overwriting existing profile picture
      });

    if (error) {
      console.error('Error uploading profile picture:', error);
      throw new Error(`Failed to upload profile picture: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get profile picture URL');
    }

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadProfilePicture:', error);
    throw error;
  }
}

/**
 * Delete an image from Supabase Storage
 * @param {string} imageUrl - The URL of the image to delete
 * @returns {Promise<void>}
 */
export async function deleteImage(imageUrl) {
  try {
    // Extract file path from URL
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/');
    const filePath = pathParts.slice(pathParts.indexOf('item-images')).join('/');

    // Delete from Supabase Storage
    const { error } = await supabase.storage
      .from('item-images')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting image:', error);
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  } catch (error) {
    console.error('Error in deleteImage:', error);
    throw error;
  }
}

