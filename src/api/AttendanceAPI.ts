import { supabase } from './SupabaseClient';

export const AttendanceAPI = {
  async logAttendance(userId: string, officeId: string, confidence: number) {
    const { data, error } = await supabase
      .from('attendance_logs')
      .insert([
        { 
          user_id: userId, 
          office_id: officeId, 
          confidence_score: confidence,
          status: 'present',
          timestamp: new Date().toISOString()
        }
      ]);

    if (error) throw error;
    return data;
  },

  async getRecentLogs(userId: string) {
    const { data, error } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data;
  }
};
