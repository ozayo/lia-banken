"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { 
  getSchools, 
  getEducationPrograms, 
  getActiveLias, 
  validateStudentEmailDomain,
  createUserProfile,
  type School,
  type EducationProgram,
  type ActiveLia
} from "@/lib/api/registration";
import { useRouter } from "next/navigation";

// Form schemas for each step
const userTypeSchema = z.object({
  userType: z.enum(["student", "school", "company"])
});

const studentFormSchema = z.object({
  firstName: z.string().min(2, "Name must be at least 2 characters"),
  lastName: z.string().min(2, "Lastname must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  schoolId: z.string().min(1, "School selection is required"),
  programId: z.string().min(1, "Program selection is required"),
  liaId: z.string().min(1, "LIA selection is required")
});

const organizationFormSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  firstName: z.string().min(2, "Name must be at least 2 characters"),
  lastName: z.string().min(2, "Lastname must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

const schoolFormSchema = z.object({
  // School admin personal info
  firstName: z.string().min(2, "Name must be at least 2 characters"),
  lastName: z.string().min(2, "Lastname must be at least 2 characters"),
  // School info  
  schoolName: z.string().min(2, "School name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

type UserTypeData = z.infer<typeof userTypeSchema>;
type StudentFormData = z.infer<typeof studentFormSchema>;
type OrganizationFormData = z.infer<typeof organizationFormSchema>;
type SchoolFormData = z.infer<typeof schoolFormSchema>;

export function MultiStepRegistrationForm() {
  const [currentStep, setCurrentStep] = useState<"userType" | "details">("userType");
  const [selectedUserType, setSelectedUserType] = useState<"student" | "school" | "company" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [programs, setPrograms] = useState<EducationProgram[]>([]);
  const [lias, setLias] = useState<ActiveLia[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const router = useRouter();

  // User type selection form
  const userTypeForm = useForm<UserTypeData>({
    resolver: zodResolver(userTypeSchema),
    defaultValues: {
      userType: undefined
    }
  });

  // Student form
  const studentForm = useForm<StudentFormData>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      schoolId: "",
      programId: "",
      liaId: ""
    }
  });

  // Organization form (for companies)
  const organizationForm = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: {
      companyName: "",
      firstName: "",
      lastName: "",
      email: "",
      password: ""
    }
  });

  // School form (for schools)
  const schoolForm = useForm<SchoolFormData>({
    resolver: zodResolver(schoolFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      schoolName: "",
      email: "",
      password: ""
    }
  });

  // Load schools on component mount
  useEffect(() => {
    const loadSchools = async () => {
      const schoolsData = await getSchools();
      setSchools(schoolsData);
    };
    loadSchools();
  }, []);

  // Handle user type selection
  const handleUserTypeSubmit = (data: UserTypeData) => {
    setSelectedUserType(data.userType);
    setCurrentStep("details");
  };

  // Handle school selection change
  const handleSchoolChange = async (schoolId: string) => {
    const school = schools.find(s => s.id === schoolId);
    setSelectedSchool(school || null);
    
    if (school) {
      const programsData = await getEducationPrograms(schoolId);
      setPrograms(programsData);
      setLias([]);
      // Reset form fields
      studentForm.setValue("programId", "");
      studentForm.setValue("liaId", "");
    }
  };

  // Handle program selection change
  const handleProgramChange = async (programId: string) => {
    const liasData = await getActiveLias(programId);
    setLias(liasData);
    // Reset LIA selection
    studentForm.setValue("liaId", "");
  };

  // Validate student email domain
  const validateStudentEmail = (email: string): boolean => {
    if (!selectedSchool) return false;
    return validateStudentEmailDomain(email, selectedSchool.allowed_domains);
  };

  // Handle student registration
  const handleStudentSubmit = async (data: StudentFormData) => {
    setIsLoading(true);
    try {
      // Validate email domain
      if (!validateStudentEmail(data.email)) {
        studentForm.setError("email", {
          message: `Email address must match the domain of the selected school: ${selectedSchool?.allowed_domains.join(", ")}`
        });
        setIsLoading(false);
        return;
      }

      const supabase = createClient();
      
      // Create auth user with metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            role: 'student',
            first_name: data.firstName,
            last_name: data.lastName,
            school_id: data.schoolId,
            program_id: data.programId,
            lia_id: data.liaId
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("User creation failed");

      alert("Registration successful! Check your email address and click on the verification link.");
      router.push("/auth/login");
      
    } catch (error: any) {
      console.error("Registration error:", error);
      alert("An error occurred during registration: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle school registration
  const handleSchoolSubmit = async (data: SchoolFormData) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      
      // Create auth user with metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            role: 'school',
            first_name: data.firstName,
            last_name: data.lastName,
            school_name: data.schoolName,
            display_name: `${data.firstName} ${data.lastName}`
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("User creation failed");

      alert("Registration successful! Check your email address and click on the verification link.");
      router.push("/auth/login");
      
    } catch (error: any) {
      console.error("Registration error:", error);
      alert("An error occurred during registration: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle organization registration (companies)
  const handleOrganizationSubmit = async (data: OrganizationFormData) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      
      // Create auth user with metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            role: 'company',
            company_name: data.companyName,
            first_name: data.firstName,
            last_name: data.lastName
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("User creation failed");

      alert("Registration successful! Check your email address and click on the verification link.");
      router.push("/auth/login");
      
    } catch (error: any) {
      console.error("Registration error:", error);
      alert("An error occurred during registration: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>
            {currentStep === "userType" ? "Select registration type" : "Registration details"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentStep === "userType" && (
            <Form {...userTypeForm}>
              <form onSubmit={userTypeForm.handleSubmit(handleUserTypeSubmit)} className="space-y-6">
                <FormField
                  control={userTypeForm.control}
                  name="userType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your registration type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="school">School</SelectItem>
                          <SelectItem value="company">Company</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  Continue
                </Button>
              </form>
            </Form>
          )}

          {currentStep === "details" && selectedUserType === "student" && (
            <Form {...studentForm}>
              <form onSubmit={studentForm.handleSubmit(handleStudentSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={studentForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={studentForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lastname</FormLabel>
                        <FormControl>
                          <Input placeholder="Lastname" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={studentForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="ornek@school.edu" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={studentForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={studentForm.control}
                  name="schoolId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>School</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleSchoolChange(value);
                        }} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your school" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {schools.map((school) => (
                            <SelectItem key={school.id} value={school.id}>
                              {school.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={studentForm.control}
                  name="programId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Program</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleProgramChange(value);
                        }} 
                        value={field.value}
                        disabled={!selectedSchool}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your program" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {programs.map((program) => (
                            <SelectItem key={program.id} value={program.id}>
                              {program.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={studentForm.control}
                  name="liaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LIA Program</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={programs.length === 0}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your LIA program" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {lias.map((lia) => (
                            <SelectItem key={lia.id} value={lia.id}>
                              {lia.lia_code} - {lia.education_term} ({new Date(lia.lia_start_date).toLocaleDateString('tr')} - {new Date(lia.lia_end_date).toLocaleDateString('tr')})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setCurrentStep("userType")}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? "Saving..." : "Register"}
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {currentStep === "details" && selectedUserType === "school" && (
            <Form {...schoolForm}>
              <form onSubmit={schoolForm.handleSubmit(handleSchoolSubmit)} className="space-y-4">
                <FormField
                  control={schoolForm.control}
                  name="schoolName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>School Name</FormLabel>
                      <FormControl>
                        <Input placeholder="School name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={schoolForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={schoolForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lastname</FormLabel>
                        <FormControl>
                          <Input placeholder="Lastname" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={schoolForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@okul.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={schoolForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setCurrentStep("userType")}
                    className="flex-1"
                  >
                    Geri
                  </Button>
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? "Saving..." : "Register"}
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {currentStep === "details" && selectedUserType === "company" && (
            <Form {...organizationForm}>
              <form onSubmit={organizationForm.handleSubmit(handleOrganizationSubmit)} className="space-y-4">
                <FormField
                  control={organizationForm.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Company name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={organizationForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={organizationForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lastname</FormLabel>
                        <FormControl>
                          <Input placeholder="Lastname" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={organizationForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@ornek.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={organizationForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Şifre</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setCurrentStep("userType")}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? "Saving..." : "Register"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}