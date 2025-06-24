OmniSoft HR Portal - Project Documentation
________________________________________
Overview
The OmniSoft HR Portal is a complete internal web-based human resources system designed for efficient management of employee data, leave requests, document handling, and employee onboarding. It features a clear role-based split between Admin and Employee access and functionalities.
________________________________________
Tech Stack
•	Frontend: HTML, CSS, JavaScript
•	Backend: Node.js + Express.js
•	Database: PostgreSQL
•	File Handling: Multer for uploads, filesystem (fs) for document access
•	Email Service: Nodemailer
________________________________________
Features
1. Authentication & Authorization
•	Admin and Employee login with session-based access.
•	Default password generation and password change functionality.
2. Employee Onboarding (Admin Access)
•	Form-based onboarding that includes:
o	Full Name, Email, Phone
o	Designation, Department
o	Resume, PF Details, Offer Letter, Form 16, Payslips
•	Generates a default email ID and password (e.g., john@omnisoftsystems.com).
•	Uploads documents into /uploads/ and stores filenames in PostgreSQL.
3. Admin Dashboard
•	Employee Directory: Searchable/filterable list of employees with:
o	Full Name, Designation, Department, Email, Employee ID
•	Leave Management:
o	View leave requests, approve/reject, update leave balances
•	Document Management:
o	Upload monthly payslips, Form 16, or other docs
o	Tag with month/year and type for easy access
4. Employee Dashboard
•	Dashboard Greeting: Shows name and birthday banner
•	Profile Management:
o	View and update name, phone, address, department, designation
•	Leave System:
o	Submit leave requests (validated against today/future date)
o	View leave request history
•	Document Center:
o	View uploaded payslips, Form 16, etc.
o	Download individual documents securely
________________________________________
Backend Routes Summary
Auth Routes (auth.js)
•	POST /signup - Register user
•	POST /login - Authenticate and create session
•	GET /logout - Destroy session
Admin Routes (adminRoutes.js)
•	POST /admin/onboard-employee - Onboard new employee
•	GET /admin/employees - List all employees
•	GET /admin/leave-requests - View leave requests
•	POST /admin/leave/approve - Approve/reject leave
•	POST /admin/upload-documents - Upload monthly docs
Employee Routes (employeeRoutes.js)
•	GET /employee/dashboard-data - Birthday + Name info
•	GET /employee/profile - Get profile info
•	PUT /employee/profile - Update profile info
•	POST /employee/change-password - Change user password
•	POST /employee/leave-request - Apply for leave
•	GET /employee/leave-history/:employeeId - View leave history
•	GET /employee/my-documents - List uploaded docs
•	GET /employee/download-document/:id/:type - Download doc by ID and type
________________________________________
Database Schema (Simplified)
users
•	id, fullname, email, password, is_admin, is_first_login, default_password
employees
•	id, employee_id, user_id, fullname, dob, designation, department, email, phone, address
employee_documents
•	id, employee_id, resume, pf_details, offer_letter, form16, payslips
leave_requests
•	id, employee_id, leave_type, from_date, to_date, reason, status, applied_on
admin_uploaded_documents
•	id, employee_id, document_type, document_name, upload_month, upload_year, uploaded_at
________________________________________
Folder Structure
project-root/
│
├── routes/
│   ├── auth.js
│   ├── adminRoutes.js
│   └── employeeRoutes.js
│
├── utils/
│   └── email.js
│
├── uploads/          ← Uploaded files stored here
├── public/           ← Frontend static files
├── db.js             ← PostgreSQL pool config
└── server.js         ← Main server entry point
________________________________________
Future Enhancements
•	Admin dashboard charts (leave trends, onboarding stats)
•	Notification system for leave updates & new document uploads
•	Bulk document upload and auto-assign by employee ID
•	Role-based permissions
•	Attendance integration
________________________________________
Credits
Developed in-house by OmniSoft Systems. Maintained by the internal IT team.
________________________________________
