// School Types
export interface School {
  id: string
  name: string
  allowed_domains: string[]
  website_url?: string
  contact_email?: string
  logo_url?: string
  description?: string
  contact_phone?: string
  organization_number?: string
  address_street?: string
  address_postal_code?: string
  address_county_id?: string
  address_municipality_id?: string
  created_at: string
  updated_at: string
}

// Education Category Types
export interface EducationCategory {
  id: number
  name: string
  created_at: string
}

// Education Program Types
export interface EducationProgram {
  id: string
  school_id: string
  name: string
  education_code?: string
  description?: string
  category_id?: number
  website_link?: string
  omfattning?: string
  studietakt?: string
  studieform?: string
  location_ids?: string[]
  duration_weeks?: number
  created_at: string
  updated_at: string
}

// School Location Types
export interface SchoolLocation {
  id: string
  school_id: string
  name: string
  address_street?: string
  address_postal_code?: string
  address_city?: string
  address_county_id?: string
  address_municipality_id?: string
  created_at: string
  updated_at: string
}

// LIA (Lärande i Arbete) Types
export type LiaStatus = 'inactive' | 'active' | 'archived'

export interface Lia {
  id: string
  school_id: string
  education_program_id: string
  
  // Basic LIA Information
  education_term: string // e.g., "2023-2024", "05/2023-06/2025", "Vår 2025-Höst 2026"
  lia_code: string // e.g., "LIA-001", "A", "Version 1"
  lia_start_date: string // ISO date string
  lia_end_date: string // ISO date string
  short_description?: string
  student_count: number
  
  // Location Information  
  location_ids: string[] // Array of school_locations.id
  
  // Contact Information
  teacher_name: string
  teacher_email: string
  teacher_phone?: string
  info_link?: string // URL for additional LIA information
  
  // Status Management
  lia_status: LiaStatus
  
  // Timestamps
  created_at: string
  updated_at: string
}

// Extended LIA with relations
export interface LiaWithRelations extends Lia {
  education_programs: EducationProgram & {
    education_categories: EducationCategory
  }
  schools: School
  // school_locations will be resolved separately since location_ids is an array
}

// For form handling
export interface LiaFormData {
  education_program_id: string
  education_term: string
  lia_code: string
  lia_start_date: string
  lia_end_date: string
  short_description?: string
  student_count: number
  location_ids: string[]
  teacher_name: string
  teacher_email: string
  teacher_phone?: string
  info_link?: string
}

// User Profile Types
export interface Profile {
  id: string // auth.users.id
  role: 'student' | 'school' | 'company' | 'admin'
  first_name?: string
  last_name?: string
  company_name?: string
  school_id?: string
  program_id?: string
  lia_id?: string // Updated: now references lias table instead of education_terms
  company_id?: string // References companies table for company admins
  phone?: string
  website?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

// Company Types
export interface Company {
  id: string
  name: string
  company_admin_id: string // auth.users.id
  
  // Company Profile
  logo_url?: string
  description?: string
  organization_number?: string
  
  // Contact Information
  contact_phone?: string
  website_url?: string
  linkedin_url?: string
  
  // Address Information
  address_street?: string
  address_postal_code?: string
  address_county_id?: number
  address_municipality_id?: number
  
  // Timestamps
  created_at: string
  updated_at: string
}

// Company Contact Types (Handledare - Responsible Persons)
export interface CompanyContact {
  id: string
  company_id: string
  
  // Contact Information
  first_name: string
  last_name: string
  email: string
  phone?: string
  
  // Role/Position
  title?: string
  is_primary: boolean
  
  // Timestamps
  created_at: string
  updated_at: string
} 