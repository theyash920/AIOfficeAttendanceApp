
import { supabase } from '../api/SupabaseClient';

type EmployeeRow = {
  id: string;
  full_name: string | null;
  face_embedding: unknown | null;
  office_id: string | null;
};

export const FaceService = {
  async uploadInitialFace(userId: string, faceEmbedding: unknown, officeId: string): Promise<boolean> {
    try {
      console.log('[FaceService] Uploading face for userId:', userId, 'officeId:', officeId);

      // 1. Check if face already exists to prevent overwrite
      const existing = await this.getEmployee(userId).catch(() => null);
      if (existing?.face_embedding) {
        throw new Error('Face already registered. Cannot overwrite.');
      }
      
      const { data, error } = await supabase
        .from('employees')
        .upsert({ id: userId, face_embedding: faceEmbedding, office_id: officeId }, { onConflict: 'id' })
        .select();

      if (error) {
        console.error('[FaceService] Supabase error:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      console.log('[FaceService] Upload successful, data:', data);
      return true;
    } catch (err: any) {
      console.error('[FaceService] Upload exception:', err);
      throw err;
    }
  },

  async getEmployee(userId: string): Promise<EmployeeRow> {
    const { data, error } = await supabase
      .from('employees')
      .select('id, full_name, face_embedding, office_id')
      .eq('id', userId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Employee not found');
    return data as EmployeeRow;
  },

  async isFaceAuthorized(): Promise<boolean> {
    return true;
  }
};
