import { createClient } from "@/lib/supabase/client";

export interface School {
  id: string;
  name: string;
  allowed_domains: string[];
  website?: string;
  contact_email?: string;
}

export interface EducationProgram {
  id: string;
  school_id: string;
  name: string;
  description?: string;
  duration_weeks?: number;
}

export interface EducationTerm {
  id: string;
  program_id: string;
  name: string;
  start_date?: string;
  end_date?: string;
  lia_start_date?: string;
  lia_end_date?: string;
  is_active: boolean;
}

// Get all schools
export async function getSchools(): Promise<School[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('schools')
    .select('id, name, allowed_domains, website, contact_email')
    .order('name');

  if (error) {
    console.error('Error fetching schools:', error);
    return [];
  }
  
  return data || [];
}

// Get education programs by school
export async function getEducationPrograms(schoolId: string): Promise<EducationProgram[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('education_programs')
    .select('id, school_id, name, description, duration_weeks')
    .eq('school_id', schoolId)
    .order('name');

  if (error) {
    console.error('Error fetching education programs:', error);
    return [];
  }
  
  return data || [];
}

// Get education terms by program
export async function getEducationTerms(programId: string): Promise<EducationTerm[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('education_terms')
    .select('id, program_id, name, start_date, end_date, lia_start_date, lia_end_date, is_active')
    .eq('program_id', programId)
    .eq('is_active', true)
    .order('start_date');

  if (error) {
    console.error('Error fetching education terms:', error);
    return [];
  }
  
  return data || [];
}

// Validate email domain for student registration
export function validateStudentEmailDomain(email: string, allowedDomains: string[]): boolean {
  const emailDomain = email.split('@')[1]?.toLowerCase();
  if (!emailDomain) return false;
  
  return allowedDomains.some(domain => 
    emailDomain === domain.toLowerCase()
  );
}

// Get schools administered by a specific user
export async function getSchoolsByAdmin(adminId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .eq('school_admin_id', adminId);

  if (error) {
    console.error('Error fetching schools by admin:', error);
    return [];
  }
  
  return data || [];
}

// Create user profile after successful registration
export async function createUserProfile(userId: string, profileData: {
  role: 'student' | 'school' | 'company';
  first_name?: string;
  last_name?: string;
  company_name?: string;
  school_id?: string;
  program_id?: string;
  term_id?: string;
  phone?: string;
  website?: string;
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      ...profileData
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
  
  return data;
} 