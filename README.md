# LIA Banken

> **This project was developed by Özay Özdemir as a graduation thesis for the Chas Academy Frontend Developer program.**

---

## About the Project

LIA Banken is a modern web platform designed to streamline the internship (LIA) process for students, schools, and companies. The platform acts as a digital bridge, connecting students seeking internships with educational institutions and employers, and centralizes all application, invitation, and placement workflows.

## Purpose

- Students can only register using their school-assigned email addresses
- Schools can manage education programs and LIA periods
- Companies can post internship ads, review student profiles, and send invitations
- All users have role-based, isolated dashboards

## Tech Stack

- **Frontend:** Next.js (App Router), TypeScript, TailwindCSS, shadcn/ui
- **Forms:** react-hook-form + zod
- **Backend:** Supabase (PostgreSQL, Auth, Storage, RLS, Realtime)
- **API:** @supabase/supabase-js
- **Deployment:** Vercel
- **Language:** English, Swedish (planned)

---

## Features by Role

### Student
- Can register only with a school email address
- Must select school, program, and term during registration
- Access to student dashboard after email verification
- Can update profile info (name, phone, city) (school, program, term are read-only)
- Can create and update their LIA profile (cover letter, CV upload, portfolio/GitHub links, desired position)
- Can publish their profile to be visible to companies
- Can apply to company internship postings
- Can track application statuses (Sent, Rejected, In Process, Accepted)
- Can receive direct invitations or interview requests from companies
- Can accept only one offer per term, which marks them as "placed"

### School
- Registers with school details and a custom email domain
- Access to school dashboard after email verification
- Can update school profile (logo, description, website, student email domains)
- Can create, update, and delete education programs
- Can add LIA periods to programs, define start/end dates and student count
- Can manage active and archived LIA periods
- Can view all students registered to their school and their statuses (placed, searching, application count)
- Can only view and manage data related to their own school

### Company
- Registers with company name and email
- Access to company dashboard
- Can update company profile and contact information
- Can create, edit, and archive LIA job postings
- Can review applications and student profiles for their postings
- Can send direct invitations or schedule interviews with students
- Can track accepted students and active interns
- Can add and manage company-specific LIA supervisors (handledare)
- Can view application and placement statistics


---

## Test the project

You can create a new school, company, and student (student needs approved domain name from school) using the registration form.

https://www.liabanken.se/auth/sign-up

You can also use the following credentials to test the project:
https://www.liabanken.se/auth/login

### School: 

The Aurora Institute (school name)
Erik Karlsson (school admin)

- Email: aura@einrot.com
- Password: testschool03

### Company: 

Aven AB (company name)
Seth Nordin (company admin)
- Email: company2@rhyta.com
- Password: testcompany02


### Student: 

Tiffany Williams (student name)
My Test School (Connected school)
- Email: student@student.edu
- Password: testschool03

---

## Contribution & Feedback

For any contributions, suggestions, or bug reports, please get in touch.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
