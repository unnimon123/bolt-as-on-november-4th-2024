import { supabase } from './supabase';

export class StorageService {
  private static readonly AVATAR_BUCKET = 'avatars';
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  static async uploadAvatar(userId: string, fileUri: string): Promise<string> {
    try {
      const fileExtension = fileUri.split('.').pop();
      const filePath = `${userId}/avatar.${fileExtension}`;

      const { data, error } = await supabase.storage
        .from(this.AVATAR_BUCKET)
        .upload(filePath, fileUri, {
          upsert: true,
          contentType: `image/${fileExtension}`
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from(this.AVATAR_BUCKET)
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  }

  static async deleteAvatar(userId: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(this.AVATAR_BUCKET)
        .remove([`${userId}/avatar`]);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting avatar:', error);
      throw error;
    }
  }
}