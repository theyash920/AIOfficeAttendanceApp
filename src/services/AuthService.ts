import { supabase } from '../api/SupabaseClient';

type EmployeeRow = {
  id: string;
  full_name: string | null;
  face_embedding: unknown | null;
  office_id: string | null;
};

const DEFAULT_OFFICE_ID = 'OFFICE_MOCK_01';

export const AuthService = {
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  async signUp(email: string, password: string, fullName: string) {
    if (!this.validateEmail(email)) {
      throw new Error('Please enter a valid email address');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    if (error) throw new Error(error.message);
    return data;
  },

  async signIn(email: string, pass: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw new Error(error.message);
    return data;
  },

  async getCurrentUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!data.user) throw new Error('No authenticated user');
    return data.user;
  },

  async handleLogin(email: string, pass: string, navigation: any) {
    await this.signIn(email, pass);
    const user = await this.getCurrentUser();

    // First check if employee exists
    const { data: existingEmployee } = await supabase
      .from('employees')
      .select('id, full_name, face_embedding, office_id')
      .eq('id', user.id)
      .single();

    // Only create employee record if it doesn't exist (don't overwrite full_name)
    if (!existingEmployee) {
      // Get full_name from auth metadata if available
      const fullName = user.user_metadata?.full_name || null;
      const { error: insertError } = await supabase
        .from('employees')
        .insert({ id: user.id, full_name: fullName, office_id: DEFAULT_OFFICE_ID });

      if (insertError) throw insertError;
    }

    // Re-fetch employee data
    const { data, error } = await supabase
      .from('employees')
      .select('id, full_name, face_embedding, office_id')
      .eq('id', user.id)
      .single();

    if (error) throw error;

    const employee = data as EmployeeRow;
    const officeId = employee.office_id ?? DEFAULT_OFFICE_ID;
    const userName = employee.full_name ?? undefined;

    if (!employee.face_embedding) {
      navigation.navigate('Onboarding', { userId: user.id, officeId, userName });
      return;
    }

    navigation.navigate('Home', { userId: user.id, officeId, userName });
  },

  async handleSignup(email: string, password: string, fullName: string, navigation: any) {
    const { user } = await this.signUp(email, password, fullName);
    if (!user) throw new Error('Signup failed');

    // Create employee record
    const { error: insertError } = await supabase
      .from('employees')
      .insert({
        id: user.id,
        full_name: fullName,
        office_id: DEFAULT_OFFICE_ID
      });

    if (insertError) throw new Error(insertError.message);

    // Navigate to onboarding for face registration
    navigation.navigate('Onboarding', { userId: user.id, officeId: DEFAULT_OFFICE_ID, userName: fullName });
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  }
};
