import { supabase } from '../api/SupabaseClient';

export const AuthService = {
  async signIn(email: string, pass: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: pass,
    });
    if (error) throw error;
    return data.session;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }
};
