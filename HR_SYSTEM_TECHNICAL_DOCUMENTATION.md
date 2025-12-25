# HR MANAGEMENT SYSTEM - TECHNICAL DOCUMENTATION

**Version:** 1.0  
**Date:** December 24, 2025  
**Stack:** Django 5.x + HTMX + Tailwind CSS + PostgreSQL  
**Status:** Module 4 Complete (Attendance with QR Check-in)

---

## TABLE OF CONTENTS

1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Database Schema](#4-database-schema)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [Multi-Tenant Architecture](#6-multi-tenant-architecture)
7. [Module 1: Accounts & Users](#7-module-1-accounts--users)
8. [Module 2: Organizations](#8-module-2-organizations)
9. [Module 3: Employees](#9-module-3-employees)
10. [Module 4: Attendance System](#10-module-4-attendance-system)
11. [QR Code Check-in System](#11-qr-code-check-in-system)
12. [Geo-Location Validation](#12-geo-location-validation)
13. [Approval Workflows](#13-approval-workflows)
14. [API Endpoints](#14-api-endpoints)
15. [Security & Permissions](#15-security--permissions)
16. [File Structure](#16-file-structure)
17. [Deployment Guide](#17-deployment-guide)
18. [Troubleshooting](#18-troubleshooting)

---

## 1. SYSTEM OVERVIEW

### 1.1 Purpose
Multi-tenant HR Management System for managing employee lifecycle, attendance tracking, leave management, and payroll processing across multiple organizations.

### 1.2 Key Features
- **Multi-tenancy:** Complete data isolation per organization
- **Role-based Access Control:** 5-tier hierarchy
- **Attendance Management:** QR code, geo-location, regularization
- **Leave Management:** Apply, approve, balance tracking
- **Employee Management:** Full CRUD with documents
- **Branch-specific Operations:** Geo-fencing per location
- **Approval Workflows:** Manager/HR approval chains

### 1.3 User Roles & Hierarchy

```
SUPER_ADMIN (Level 5)
    └── Manages all organizations
    └── Full platform access
    └── Can impersonate any role

ORG_ADMIN (Level 4)
    └── Full control within organization
    └── Configure settings, shifts, departments
    └── Manage all users in organization

HR_ADMIN (Level 3)
    └── Day-to-day HR operations
    └── Employee management
    └── Attendance & leave processing
    └── Generate reports

MANAGER (Level 2)
    └── Team management only
    └── Approve team attendance/leave
    └── View team reports

EMPLOYEE (Level 1)
    └── Self-service only
    └── Check-in/out
    └── Apply leave
    └── View own records
```

---

## 2. ARCHITECTURE

### 2.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Browser   │  │   Mobile    │  │  Reception  │    │
│  │  (Desktop)  │  │   Device    │  │   Screen    │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────┘
                          ↓ HTTPS
┌─────────────────────────────────────────────────────────┐
│                  PRESENTATION LAYER                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Django Templates + HTMX + Tailwind CSS          │  │
│  │  - Server-side rendering                          │  │
│  │  - HTMX for dynamic interactions                  │  │
│  │  - No JavaScript framework required               │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │           Django 5.x Web Framework                │  │
│  │  ┌────────────┐  ┌────────────┐  ┌───────────┐  │  │
│  │  │  Accounts  │  │    Org     │  │ Employees │  │  │
│  │  │   Views    │  │   Views    │  │   Views   │  │  │
│  │  └────────────┘  └────────────┘  └───────────┘  │  │
│  │  ┌────────────┐  ┌────────────┐                 │  │
│  │  │ Attendance │  │   Leaves   │                 │  │
│  │  │   Views    │  │   Views    │                 │  │
│  │  └────────────┘  └────────────┘                 │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │            BUSINESS LOGIC LAYER                   │  │
│  │  - Role-based permissions (decorators)            │  │
│  │  - Multi-tenant isolation (middleware)            │  │
│  │  - Approval workflows                             │  │
│  │  - Geo-location validation                        │  │
│  │  - QR token generation/validation                 │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                     DATA LAYER                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │            Django ORM (Mongoose)                  │  │
│  │  - Models with relationships                      │  │
│  │  - Automatic migrations                           │  │
│  │  - Query optimization (select_related)            │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   DATABASE LAYER                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │  PostgreSQL 15+ (Production)                      │  │
│  │  SQLite 3 (Development)                           │  │
│  │  - ACID compliance                                │  │
│  │  - Foreign key constraints                        │  │
│  │  - Indexing for performance                       │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Request Flow

```
1. User Request → Django URL Router
2. URL Router → View Function
3. View → Check Authentication (JWT/Session)
4. View → Check Authorization (Role Decorator)
5. View → Check Multi-tenant Context (Middleware)
6. View → Business Logic Execution
7. View → Database Query (ORM)
8. View → Render Template (Django Template Engine)
9. Response → Browser (HTML + HTMX)
```

---

## 3. TECHNOLOGY STACK

### 3.1 Core Technologies

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Language | Python | 3.11+ | Backend logic |
| Framework | Django | 5.x | Web framework |
| Database | PostgreSQL | 15+ | Production DB |
| Database (Dev) | SQLite | 3.x | Development DB |
| Frontend | HTMX | 1.9+ | Dynamic interactions |
| CSS | Tailwind CSS | 3.x | Styling (CDN) |
| Forms | Django Crispy Forms | 2.x | Form rendering |
| Images | Pillow | 10.x | Image processing |

### 3.2 Python Packages

```python
# requirements.txt
django>=5.0
psycopg2-binary      # PostgreSQL adapter
django-htmx          # HTMX integration
python-dotenv        # Environment variables
Pillow               # Image handling
django-crispy-forms  # Form styling
crispy-tailwind      # Tailwind for forms
qrcode               # QR code generation
```

### 3.3 No Build Tools Required

- ✅ No npm
- ✅ No webpack
- ✅ No node_modules
- ✅ Tailwind via CDN
- ✅ HTMX via CDN
- ✅ Pure server-side rendering

---

## 4. DATABASE SCHEMA

### 4.1 Entity Relationship Diagram

```
┌─────────────────────┐
│   Organization      │
│  (Multi-tenant)     │
├─────────────────────┤
│ id (PK)             │
│ name                │
│ slug (unique)       │
│ logo                │
│ geo_fence_radius    │
│ qr_refresh_interval │
│ require_geo_valid   │
│ require_approval    │
└─────────────────────┘
         │
         │ 1:N
         ├──────────────┐
         │              │
         ↓              ↓
┌─────────────┐  ┌─────────────┐
│ Department  │  │   Branch    │
├─────────────┤  ├─────────────┤
│ id (PK)     │  │ id (PK)     │
│ org_id (FK) │  │ org_id (FK) │
│ name        │  │ name        │
│ code        │  │ latitude    │
└─────────────┘  │ longitude   │
                 │ geo_fence   │
                 └─────────────┘
         │              │
         └──────┬───────┘
                │ 1:N
                ↓
         ┌─────────────┐
         │    User     │
         ├─────────────┤
         │ id (PK)     │
         │ email       │
         │ role        │
         │ org_id (FK) │
         └─────────────┘
                │ 1:1
                ↓
         ┌─────────────┐
         │  Employee   │
         ├─────────────┤
         │ id (PK)     │
         │ user_id (FK)│
         │ emp_id      │
         │ dept_id(FK) │
         │ branch(FK)  │
         │ shift (FK)  │
         └─────────────┘
                │
                │ 1:N
                ├──────────────┐
                ↓              ↓
         ┌─────────────┐ ┌─────────────┐
         │ Attendance  │ │   Leave     │
         ├─────────────┤ ├─────────────┤
         │ id (PK)     │ │ id (PK)     │
         │ emp_id (FK) │ │ emp_id (FK) │
         │ date        │ │ from_date   │
         │ check_in    │ │ to_date     │
         │ status      │ │ status      │
         │ latitude    │ │ days        │
         │ longitude   │ └─────────────┘
         │ approved_by │
         └─────────────┘
```

### 4.2 Core Models

#### 4.2.1 Organization Model

```python
class Organization(models.Model):
    # Basic Info
    name = CharField(max_length=200)
    slug = SlugField(unique=True)
    logo = ImageField(upload_to='org_logos/')
    
    # Address
    address_line1 = CharField(max_length=255)
    city = CharField(max_length=100)
    state = CharField(max_length=100)
    country = CharField(max_length=100, default='India')
    
    # Contact
    email = EmailField()
    phone = CharField(max_length=20)
    website = URLField()
    
    # Statutory
    gst_number = CharField(max_length=20)
    pan_number = CharField(max_length=20)
    
    # QR & Geo Settings
    qr_refresh_interval = IntegerField(default=5)  # minutes
    geo_fence_radius = IntegerField(default=50)    # meters
    require_geo_validation = BooleanField(default=True)
    require_approval_for_employees = BooleanField(default=True)
    
    # System
    financial_year_start = IntegerField(default=4)  # April
    week_off_days = JSONField(default=list)
    is_active = BooleanField(default=True)
    created_at = DateTimeField(auto_now_add=True)
```

#### 4.2.2 User Model (Custom)

```python
class User(AbstractUser):
    class Role(TextChoices):
        SUPER_ADMIN = 'SUPER_ADMIN', 'Super Admin'
        ORG_ADMIN = 'ORG_ADMIN', 'Organization Admin'
        HR_ADMIN = 'HR_ADMIN', 'HR Admin'
        MANAGER = 'MANAGER', 'Manager'
        EMPLOYEE = 'EMPLOYEE', 'Employee'
    
    email = EmailField(unique=True)
    role = CharField(max_length=20, choices=Role.choices)
    organization = ForeignKey(Organization, null=True)
    phone = CharField(max_length=20)
    is_first_login = BooleanField(default=True)
    
    USERNAME_FIELD = 'email'
    
    @property
    def role_level(self):
        levels = {
            'SUPER_ADMIN': 5,
            'ORG_ADMIN': 4,
            'HR_ADMIN': 3,
            'MANAGER': 2,
            'EMPLOYEE': 1,
        }
        return levels.get(self.role, 0)
```

#### 4.2.3 Employee Model

```python
class Employee(models.Model):
    # Link to User (1:1)
    user = OneToOneField(User, on_delete=CASCADE)
    organization = ForeignKey(Organization)
    
    # Identity
    employee_id = CharField(max_length=20)
    
    # Personal
    first_name = CharField(max_length=100)
    last_name = CharField(max_length=100)
    date_of_birth = DateField()
    gender = CharField(choices=GENDER_CHOICES)
    phone = CharField(max_length=20)
    
    # Professional
    department = ForeignKey(Department, null=True)
    branch = ForeignKey(Branch, null=True)
    shift = ForeignKey(Shift, null=True)
    designation = CharField(max_length=100)
    reporting_manager = ForeignKey('self', null=True)
    
    # Employment
    date_of_joining = DateField()
    employment_status = CharField(choices=STATUS_CHOICES)
    employment_type = CharField(choices=TYPE_CHOICES)
    
    # Meta
    is_active = BooleanField(default=True)
    created_at = DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['organization', 'employee_id']
```

#### 4.2.4 Attendance Model

```python
class Attendance(models.Model):
    class Status(TextChoices):
        PRESENT = 'present', 'Present'
        LATE = 'late', 'Late'
        HALF_DAY = 'half_day', 'Half Day'
        ABSENT = 'absent', 'Absent'
        PENDING_APPROVAL = 'pending_approval', 'Pending Approval'
        WEEK_OFF = 'week_off', 'Week Off'
        HOLIDAY = 'holiday', 'Holiday'
        ON_LEAVE = 'on_leave', 'On Leave'
        WFH = 'wfh', 'Work From Home'
    
    employee = ForeignKey(Employee)
    date = DateField()
    
    # Check-in/out
    check_in_time = DateTimeField(null=True)
    check_out_time = DateTimeField(null=True)
    check_in_method = CharField(choices=METHOD_CHOICES)
    
    # Status
    status = CharField(choices=Status.choices)
    working_hours = DecimalField(max_digits=4, decimal_places=2)
    late_by_minutes = IntegerField(default=0)
    
    # Geo-location
    check_in_latitude = DecimalField(max_digits=9, decimal_places=6)
    check_in_longitude = DecimalField(max_digits=9, decimal_places=6)
    
    # Approval
    requires_approval = BooleanField(default=False)
    approved_by = ForeignKey(User, null=True)
    approved_at = DateTimeField(null=True)
    
    # Regularization
    is_regularized = BooleanField(default=False)
    regularization_reason = TextField()
    regularization_status = CharField(max_length=20)
    
    class Meta:
        unique_together = ['employee', 'date']
        ordering = ['-date']
```

#### 4.2.5 QRToken Model

```python
class QRToken(models.Model):
    token = CharField(max_length=100, unique=True)
    organization = ForeignKey(Organization)
    branch = ForeignKey(Branch)
    
    created_at = DateTimeField(auto_now_add=True)
    expires_at = DateTimeField()
    is_active = BooleanField(default=True)
    
    def is_valid(self):
        return (
            self.is_active and 
            timezone.now() < self.expires_at
        )
```

### 4.3 Database Indexes

```python
# Critical indexes for performance
indexes = [
    # Attendance
    ['employee_id', 'date'],           # Unique together
    ['organization_id', 'date'],       # Daily reports
    ['status'],                        # Status filtering
    
    # Employee
    ['organization_id', 'employee_id'],# Unique together
    ['organization_id', 'is_active'],  # Active employees
    ['department_id'],                 # Department queries
    ['branch_id'],                     # Branch queries
    
    # User
    ['email'],                         # Login (unique)
    ['organization_id', 'role'],       # Role filtering
    
    # QRToken
    ['token'],                         # Token validation (unique)
    ['branch_id', 'is_active'],        # Active tokens
]
```

---

## 5. AUTHENTICATION & AUTHORIZATION

### 5.1 Authentication Flow

```
┌─────────────┐
│ User Login  │
│ (email+pwd) │
└─────────────┘
      ↓
┌─────────────────────────┐
│ Django Authentication   │
│ - Validate credentials  │
│ - Create session        │
└─────────────────────────┘
      ↓
┌─────────────────────────┐
│ Check is_first_login    │
└─────────────────────────┘
      ↓           ↓
  Yes │           │ No
      ↓           ↓
┌──────────┐  ┌──────────┐
│ Password │  │Dashboard │
│  Change  │  │          │
└──────────┘  └──────────┘
```

### 5.2 Password Policy

```python
# Minimum 6 characters (configurable)
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 6}
    }
]

# First login flow
if user.is_first_login:
    # Force password change
    redirect('accounts:change_password')
    
# After password change
user.is_first_login = False
user.save()
```

### 5.3 Session Management

```python
# Session settings
SESSION_COOKIE_AGE = 1800  # 30 minutes
SESSION_SAVE_EVERY_REQUEST = True
SESSION_EXPIRE_AT_BROWSER_CLOSE = True

# Login with remember me (optional)
if remember_me:
    request.session.set_expiry(60 * 60 * 24 * 30)  # 30 days
else:
    request.session.set_expiry(0)  # Browser close
```

### 5.4 Role-Based Decorators

```python
# apps/accounts/decorators.py

def role_required(allowed_roles):
    """
    Decorator to check if user has required role
    
    Usage:
        @role_required(['SUPER_ADMIN', 'ORG_ADMIN'])
        def my_view(request):
            ...
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return redirect('accounts:login')
            
            if request.user.role not in allowed_roles:
                messages.error(request, 'Access denied')
                return redirect('dashboard')
            
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator

# Example usage
@role_required(['SUPER_ADMIN', 'ORG_ADMIN', 'HR_ADMIN'])
def employee_list(request):
    # Only these 3 roles can access
    ...
```

---

## 6. MULTI-TENANT ARCHITECTURE

### 6.1 Tenant Isolation Strategy

**Row-Level Isolation:** Each record belongs to one organization via `organization_id` foreign key.

```python
# All queries automatically filtered by organization
if request.user.role == 'SUPER_ADMIN':
    # Can see all organizations
    employees = Employee.objects.all()
else:
    # See only own organization
    employees = Employee.objects.filter(
        organization=request.user.organization
    )
```

### 6.2 Organization Context Middleware

```python
# Automatically sets organization context
class TenantMiddleware:
    def __call__(self, request):
        if request.user.is_authenticated:
            if request.user.role == 'SUPER_ADMIN':
                # Can switch organizations
                request.org_id = request.GET.get('org_id') or None
            else:
                # Fixed to own organization
                request.org_id = request.user.organization_id
        
        return self.get_response(request)
```

### 6.3 Form Filtering

```python
# Automatically filter dropdowns by organization
class EmployeeForm(forms.ModelForm):
    def __init__(self, *args, user=None, **kwargs):
        super().__init__(*args, **kwargs)
        
        if user:
            if user.role == 'SUPER_ADMIN':
                # Show all organizations
                self.fields['organization'].queryset = Organization.objects.all()
            else:
                # Lock to user's organization
                org = user.organization
                self.fields['organization'].initial = org
                self.fields['organization'].disabled = True
                
                # Filter related fields
                self.fields['department'].queryset = Department.objects.filter(
                    organization=org
                )
                self.fields['branch'].queryset = Branch.objects.filter(
                    organization=org
                )
```

---

## 7. MODULE 1: ACCOUNTS & USERS

### 7.1 Features

- Login/Logout
- First login password change
- Role-based access control
- User CRUD (with hierarchy enforcement)
- Admin password reset

### 7.2 Views

#### Login View

```python
def login_view(request):
    if request.method == 'POST':
        form = LoginForm(request, data=request.POST)
        if form.is_valid():
            user = form.get_user()
            auth_login(request, user)
            
            # Check first login
            if user.is_first_login:
                return redirect('accounts:change_password')
            
            return redirect('dashboard')
    else:
        form = LoginForm()
    
    return render(request, 'accounts/login.html', {'form': form})
```

#### Change Password View

```python
@login_required
def change_password(request):
    if request.method == 'POST':
        form = PasswordChangeForm(request.user, request.POST)
        if form.is_valid():
            user = form.save()
            user.is_first_login = False
            user.save()
            
            # Re-authenticate after password change
            update_session_auth_hash(request, user)
            
            messages.success(request, 'Password changed successfully')
            return redirect('dashboard')
    else:
        form = PasswordChangeForm(request.user)
    
    return render(request, 'accounts/change_password.html', {'form': form})
```

### 7.3 URL Patterns

```python
# apps/accounts/urls.py
urlpatterns = [
    path('login/', login_view, name='login'),
    path('logout/', logout_view, name='logout'),
    path('change-password/', change_password, name='change_password'),
]
```

---

## 8. MODULE 2: ORGANIZATIONS

### 8.1 Features

- Organization CRUD (SUPER_ADMIN only)
- Department management
- Branch management (with geo-location)
- Shift management (with timing rules)
- Organization settings (QR interval, geo-fence radius)

### 8.2 Branch Geo-Location

```python
class Branch(models.Model):
    organization = ForeignKey(Organization)
    name = CharField(max_length=100)
    code = CharField(max_length=20)
    
    # Geo-location for attendance validation
    latitude = DecimalField(max_digits=9, decimal_places=6)
    longitude = DecimalField(max_digits=9, decimal_places=6)
    geo_fence_radius = IntegerField(default=100)  # meters
    
    # Can override org-level radius
    # If null, uses organization.geo_fence_radius
```

### 8.3 Shift Configuration

```python
class Shift(models.Model):
    organization = ForeignKey(Organization)
    name = CharField(max_length=100)
    code = CharField(max_length=20)
    
    # Timing
    start_time = TimeField()  # e.g., 09:00
    end_time = TimeField()    # e.g., 18:00
    
    # Thresholds (in minutes)
    grace_period_minutes = IntegerField(default=15)
    # Late if check-in > start_time + grace_period
    
    # Status calculation
    # PRESENT: within grace period
    # LATE: > grace_period, < 120 minutes
    # HALF_DAY: > 120 minutes
```

---

## 9. MODULE 3: EMPLOYEES

### 9.1 Features

- Employee CRUD with full profile
- Auto-generate employee ID
- Link to user account (1:1)
- Document management
- Department/Branch/Shift assignment
- Reporting manager hierarchy

### 9.2 Employee Creation Flow

```python
@role_required(['SUPER_ADMIN', 'ORG_ADMIN', 'HR_ADMIN'])
def employee_create(request):
    if request.method == 'POST':
        form = EmployeeForm(request.POST, user=request.user)
        if form.is_valid():
            employee = form.save(commit=False)
            
            # Set organization
            if request.user.role != 'SUPER_ADMIN':
                employee.organization = request.user.organization
            
            # Create user account
            org_domain = employee.organization.name.lower().replace(' ', '')
            email = f"{first_name}.{last_name}@{org_domain}.com"
            
            user = User.objects.create_user(
                username=employee_id,
                email=email,
                password='password123',  # Default password
                role='EMPLOYEE',
                organization=employee.organization
            )
            
            employee.user = user
            employee.save()
            
            messages.success(request, f'Employee created! Login: {email}')
            return redirect('employees:employee_list')
```

### 9.3 Employee Profile

```
Personal Details
├── Name, DOB, Gender
├── Contact (phone, email)
├── Emergency contact
└── Address

Professional Details
├── Employee ID
├── Department
├── Branch
├── Shift
├── Designation
├── Reporting Manager
└── Employment status

Bank & Statutory
├── Bank account details
├── PAN number
├── Aadhar number
└── UAN/ESI numbers
```

---

## 10. MODULE 4: ATTENDANCE SYSTEM

### 10.1 Attendance Methods

| Method | Description | Use Case |
|--------|-------------|----------|
| Manual | HR marks attendance | Corrections, bulk entry |
| QR Code | Employee scans QR | Reception check-in |
| Geo-location | GPS validation | Field employees |
| Biometric | Integration ready | High security (future) |

### 10.2 Attendance Statuses

```python
class Status(TextChoices):
    PRESENT = 'present'           # On time
    LATE = 'late'                 # Late within 2 hours
    HALF_DAY = 'half_day'         # Late > 2 hours
    ABSENT = 'absent'             # No check-in
    PENDING_APPROVAL = 'pending_approval'  # Awaiting approval
    WEEK_OFF = 'week_off'         # Weekly off day
    HOLIDAY = 'holiday'           # Public holiday
    ON_LEAVE = 'on_leave'         # Approved leave
    WFH = 'wfh'                   # Work from home
```

### 10.3 Status Calculation Logic

```python
def calculate_status(check_in_time, shift):
    """Calculate attendance status based on check-in time"""
    today = check_in_time.date()
    shift_start = datetime.combine(today, shift.start_time)
    shift_start = timezone.make_aware(shift_start)
    
    # Calculate late minutes
    late_minutes = max(0, int(
        (check_in_time - shift_start).total_seconds() / 60
    ))
    
    # Determine status
    if late_minutes <= shift.grace_period_minutes:
        return 'present', 0
    elif late_minutes <= 120:  # 2 hours
        return 'late', late_minutes
    else:
        return 'half_day', late_minutes
```

### 10.4 Manual Check-in Flow

```python
@login_required
def checkin(request):
    employee = request.user.employee
    today = timezone.now().date()
    now = timezone.now()
    
    # Prevent duplicate check-in
    if Attendance.objects.filter(employee=employee, date=today).exists():
        messages.warning(request, 'Already checked in')
        return redirect('attendance:dashboard')
    
    # Validate shift
    if not employee.shift:
        messages.error(request, 'No shift assigned')
        return redirect('attendance:dashboard')
    
    # Calculate status
    status, late_minutes = calculate_status(now, employee.shift)
    
    # Create attendance
    Attendance.objects.create(
        employee=employee,
        date=today,
        check_in_time=now,
        check_in_method='manual',
        status=status,
        late_by_minutes=late_minutes
    )
    
    messages.success(request, f'Checked in at {now.strftime("%I:%M %p")}')
    return redirect('attendance:dashboard')
```

### 10.5 Checkout Flow

```python
@login_required
def checkout(request):
    employee = request.user.employee
    today = timezone.now().date()
    now = timezone.now()
    
    # Get today's attendance
    try:
        attendance = Attendance.objects.get(employee=employee, date=today)
    except Attendance.DoesNotExist:
        messages.error(request, 'Not checked in')
        return redirect('attendance:dashboard')
    
    # Prevent duplicate checkout
    if attendance.check_out_time:
        messages.warning(request, 'Already checked out')
        return redirect('attendance:dashboard')
    
    # Update checkout
    attendance.check_out_time = now
    
    # Calculate working hours
    time_diff = now - attendance.check_in_time
    attendance.working_hours = round(time_diff.total_seconds() / 3600, 2)
    attendance.save()
    
    messages.success(request, f'Checked out. Hours: {attendance.working_hours}')
    return redirect('attendance:dashboard')
```

### 10.6 Regularization Workflow

```
Employee → Request Regularization
    ↓
    └─→ Reason: "Traffic jam"
    └─→ Requested time: 09:00 AM
    
Manager/HR → Review Request
    ↓
    ├─→ Approve → Status changed to PRESENT
    │             Late minutes = 0
    │
    └─→ Reject → Status remains LATE/HALF_DAY
                 Late minutes unchanged
```

```python
@login_required
def request_regularization(request, pk):
    attendance = get_object_or_404(Attendance, pk=pk)
    
    # Only own attendance
    if attendance.employee != request.user.employee:
        messages.error(request, 'Unauthorized')
        return redirect('attendance:dashboard')
    
    if request.method == 'POST':
        reason = request.POST.get('reason')
        
        attendance.regularization_reason = reason
        attendance.regularization_status = 'pending'
        attendance.regularization_requested_at = timezone.now()
        attendance.save()
        
        messages.success(request, 'Regularization request submitted')
        return redirect('attendance:history')
```

---

## 11. QR CODE CHECK-IN SYSTEM

### 11.1 QR System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   QR WORKFLOW                       │
└─────────────────────────────────────────────────────┘

1. HR/Admin → Select Branch → Generate QR
   ↓
2. System → Create QRToken (branch-specific)
   ├─→ token: unique random string
   ├─→ branch: selected branch
   ├─→ expires_at: now + qr_refresh_interval
   └─→ is_active: true
   ↓
3. Display QR on Reception Screen
   ├─→ Auto-refresh every N minutes
   ├─→ Shows organization logo
   └─→ Shows branch name
   ↓
4. Employee → Scan QR with phone
   ↓
5. Opens Check-in Page
   ├─→ Enter Employee ID
   ├─→ Browser requests location
   └─→ Submit
   ↓
6. System Validation
   ├─→ Validate QR token (not expired)
   ├─→ Validate Employee ID
   ├─→ Validate Geo-location (within radius)
   ├─→ Check duplicate check-in
   └─→ Calculate status
   ↓
7. Check Approval Requirement
   ├─→ If role = EMPLOYEE & org.require_approval = true
   │   └─→ Create attendance with status = 'pending_approval'
   │
   └─→ Else
       └─→ Create attendance with calculated status
   ↓
8. Success Response
   └─→ Show check-in time & status
```

### 11.2 QR Token Generation

```python
import secrets
import qrcode
from io import BytesIO

def generate_qr_token():
    """Generate cryptographically secure random token"""
    return secrets.token_urlsafe(32)

def generate_qr_code(token, base_url):
    """Generate QR code image"""
    # Create check-in URL
    url = f"{base_url}/attendance/qr/scan/?token={token}"
    
    # Generate QR
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(url)
    qr.make(fit=True)
    
    # Create image
    img = qr.make_image(fill_color='black', back_color='white')
    
    # Save to BytesIO
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    
    return ContentFile(buffer.read(), name=f'qr_{token[:8]}.png')
```

### 11.3 QR Display View (Auto-refresh)

```python
@role_required(['SUPER_ADMIN', 'ORG_ADMIN', 'HR_ADMIN'])
def qr_display(request, branch_id):
    """Full-screen QR display with auto-refresh"""
    branch = get_object_or_404(Branch, pk=branch_id)
    org = branch.organization
    
    # Convert minutes to milliseconds for JavaScript
    refresh_interval = org.qr_refresh_interval * 60 * 1000
    
    return render(request, 'attendance/qr_display.html', {
        'branch': branch,
        'organization': org,
        'refresh_interval': refresh_interval
    })
```

**Template with Auto-refresh:**

```html
<!-- templates/attendance/qr_display.html -->
<script>
    // Auto-refresh QR code
    const refreshInterval = {{ refresh_interval }};  // milliseconds
    
    setTimeout(() => {
        location.reload();  // Refresh page to get new QR
    }, refreshInterval);
    
    // Show countdown
    let remaining = refreshInterval / 1000;  // seconds
    setInterval(() => {
        remaining--;
        document.getElementById('countdown').textContent = 
            `Refreshing in ${remaining}s`;
    }, 1000);
</script>
```

### 11.4 QR Check-in View

```python
@login_required
def qr_checkin(request):
    """Employee check-in via QR scan"""
    token = request.GET.get('token')
    
    # Validate token
    try:
        qr_token = QRToken.objects.select_related(
            'organization', 'branch'
        ).get(token=token)
    except QRToken.DoesNotExist:
        return render(request, 'attendance/qr_scan.html', {
            'error': 'Invalid QR code'
        })
    
    # Check expiration
    if not qr_token.is_valid():
        return render(request, 'attendance/qr_scan.html', {
            'error': 'QR code expired. Ask reception to refresh.'
        })
    
    organization = qr_token.organization
    branch = qr_token.branch
    
    if request.method == 'POST':
        employee_id = request.POST.get('employee_id')
        user_lat = request.POST.get('latitude')
        user_lon = request.POST.get('longitude')
        
        # Find employee
        try:
            employee = Employee.objects.select_related(
                'user', 'shift', 'branch'
            ).get(
                employee_id=employee_id,
                organization=organization,
                is_active=True
            )
        except Employee.DoesNotExist:
            return render(request, 'attendance/qr_scan.html', {
                'error': f'Employee ID "{employee_id}" not found'
            })
        
        # Check duplicate
        today = timezone.now().date()
        if Attendance.objects.filter(employee=employee, date=today).exists():
            return render(request, 'attendance/qr_scan.html', {
                'error': 'Already checked in today'
            })
        
        # Validate geo-location
        if organization.require_geo_validation:
            if not user_lat or not user_lon:
                return render(request, 'attendance/qr_scan.html', {
                    'error': 'Location required. Enable location access.'
                })
            
            # Use BRANCH location (not organization)
            office_lat = branch.latitude
            office_lon = branch.longitude
            radius = branch.geo_fence_radius or organization.geo_fence_radius
            
            from .geo_utils import is_within_geofence
            
            within_fence, distance = is_within_geofence(
                float(user_lat), float(user_lon),
                float(office_lat), float(office_lon),
                radius
            )
            
            if not within_fence:
                return render(request, 'attendance/qr_scan.html', {
                    'error': f'Too far ({int(distance)}m). Must be within {radius}m'
                })
        
        # Calculate status
        now = timezone.now()
        status, late_minutes = calculate_status(now, employee.shift)
        
        # Check approval requirement (EMPLOYEE role only)
        user = employee.user
        requires_approval = (
            user.role == 'EMPLOYEE' and
            organization.require_approval_for_employees
        )
        
        if requires_approval:
            status = 'pending_approval'
        
        # Create attendance
        Attendance.objects.create(
            employee=employee,
            date=today,
            check_in_time=now,
            check_in_method='qr',
            status=status,
            late_by_minutes=late_minutes if not requires_approval else 0,
            check_in_latitude=user_lat,
            check_in_longitude=user_lon,
            requires_approval=requires_approval
        )
        
        # Success
        if requires_approval:
            message = 'Check-in request sent for approval'
            display_status = 'Pending Approval'
        else:
            message = 'Check-in successful!'
            display_status = status.replace('_', ' ').title()
        
        return render(request, 'attendance/qr_scan.html', {
            'success': True,
            'message': message,
            'time': now.strftime("%I:%M %p"),
            'status': display_status
        })
    
    # GET request - show form
    return render(request, 'attendance/qr_scan.html', {
        'token': token,
        'branch': branch
    })
```

---

## 12. GEO-LOCATION VALIDATION

### 12.1 Haversine Formula

```python
# apps/attendance/geo_utils.py
import math

def calculate_distance(lat1, lon1, lat2, lon2):
    """
    Calculate distance between two coordinates using Haversine formula
    Returns distance in meters
    """
    # Earth radius in meters
    R = 6371000
    
    # Convert to radians
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    # Haversine formula
    a = (math.sin(delta_lat / 2) ** 2 +
         math.cos(lat1_rad) * math.cos(lat2_rad) *
         math.sin(delta_lon / 2) ** 2)
    
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c
    
    return distance

def is_within_geofence(user_lat, user_lon, office_lat, office_lon, radius):
    """
    Check if user is within geo-fence radius
    
    Returns:
        (within_fence: bool, distance: float)
    """
    distance = calculate_distance(user_lat, user_lon, office_lat, office_lon)
    within_fence = distance <= radius
    
    return within_fence, distance
```

### 12.2 Browser Geolocation (JavaScript)

```html
<!-- templates/attendance/qr_scan.html -->
<script>
let locationObtained = false;

// Request location on page load
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        // Success callback
        function(position) {
            document.getElementById('latitude').value = position.coords.latitude;
            document.getElementById('longitude').value = position.coords.longitude;
            locationObtained = true;
            
            // Enable submit button
            document.getElementById('submitBtn').disabled = false;
            document.getElementById('locationStatus').innerHTML = 
                '<span class="text-green-600">✓ Location obtained</span>';
        },
        // Error callback
        function(error) {
            document.getElementById('locationStatus').innerHTML = 
                '<span class="text-red-600">✗ Location denied</span>';
            alert('Please enable location access to check in');
        }
    );
} else {
    alert('Geolocation not supported by browser');
}

// Disable submit until location obtained
document.getElementById('checkInForm').onsubmit = function(e) {
    if (!locationObtained) {
        e.preventDefault();
        alert('Waiting for location...');
        return false;
    }
};
</script>

<form method="post" id="checkInForm">
    {% csrf_token %}
    <input type="hidden" name="latitude" id="latitude">
    <input type="hidden" name="longitude" id="longitude">
    
    <input type="text" name="employee_id" placeholder="Employee ID" required>
    
    <div id="locationStatus">Obtaining location...</div>
    
    <button type="submit" id="submitBtn" disabled>
        Check In
    </button>
</form>
```

### 12.3 Location Configuration

```
Organization Level:
├── geo_fence_radius: 50 meters (default)
└── require_geo_validation: true/false

Branch Level (overrides org):
├── latitude: 26.912434
├── longitude: 75.787270
└── geo_fence_radius: 100 meters (optional override)
```

---

## 13. APPROVAL WORKFLOWS

### 13.1 Check-in Approval Workflow

```
┌──────────────────────────────────────────────────────┐
│            CHECK-IN APPROVAL FLOW                    │
└──────────────────────────────────────────────────────┘

Employee (EMPLOYEE role) → QR Check-in
    ↓
IF org.require_approval_for_employees = true:
    ↓
    Create Attendance
    ├── status = 'pending_approval'
    ├── requires_approval = true
    └── approved_by = null
    ↓
    Notify Manager/HR
    ↓
Manager/HR → Review Pending List
    ↓
    ├─→ APPROVE
    │   ├── Recalculate status (present/late/half_day)
    │   ├── Set approved_by = current_user
    │   ├── Set approved_at = now
    │   └── Update attendance status
    │
    └─→ REJECT
        └── Delete attendance record

ELSE (other roles or approval not required):
    ↓
    Create Attendance
    ├── status = calculated (present/late/half_day)
    ├── requires_approval = false
    └── Auto-approved
```

### 13.2 Approval Views

```python
@role_required(['SUPER_ADMIN', 'ORG_ADMIN', 'HR_ADMIN', 'MANAGER'])
def pending_checkin_approvals(request):
    """List pending check-in requests"""
    if request.user.role == 'MANAGER':
        # Manager sees only their team
        manager_employee = request.user.employee
        team_employees = Employee.objects.filter(
            reporting_manager=manager_employee
        )
        attendances = Attendance.objects.filter(
            employee__in=team_employees,
            status='pending_approval'
        )
    else:
        # HR/Admin sees all in organization
        attendances = Attendance.objects.filter(
            employee__organization=request.user.organization,
            status='pending_approval'
        )
    
    attendances = attendances.select_related('employee').order_by('-check_in_time')
    
    return render(request, 'attendance/pending_checkin_approvals.html', {
        'attendances': attendances
    })

@role_required(['SUPER_ADMIN', 'ORG_ADMIN', 'HR_ADMIN', 'MANAGER'])
def approve_checkin(request, pk):
    """Approve check-in request"""
    attendance = get_object_or_404(Attendance, pk=pk)
    
    # Recalculate actual status
    shift = attendance.employee.shift
    today = attendance.date
    shift_start = datetime.combine(today, shift.start_time)
    shift_start = timezone.make_aware(shift_start)
    
    late_minutes = max(0, int(
        (attendance.check_in_time - shift_start).total_seconds() / 60
    ))
    
    if late_minutes <= shift.grace_period_minutes:
        status = 'present'
    elif late_minutes <= 120:
        status = 'late'
    else:
        status = 'half_day'
    
    # Update attendance
    attendance.status = status
    attendance.late_by_minutes = late_minutes if status != 'present' else 0
    attendance.approved_by = request.user
    attendance.approved_at = timezone.now()
    attendance.save()
    
    messages.success(request, f'Check-in approved')
    return redirect('attendance:pending_checkin_approvals')

@role_required(['SUPER_ADMIN', 'ORG_ADMIN', 'HR_ADMIN', 'MANAGER'])
def reject_checkin(request, pk):
    """Reject check-in request"""
    attendance = get_object_or_404(Attendance, pk=pk)
    attendance.delete()
    
    messages.success(request, f'Check-in rejected')
    return redirect('attendance:pending_checkin_approvals')
```

### 13.3 Regularization Approval

```
Employee → Request Regularization
    ↓
    Reason: "Traffic jam, delayed by accident"
    ↓
Manager/HR → Review
    ↓
    ├─→ APPROVE
    │   ├── status = 'present'
    │   ├── late_by_minutes = 0
    │   ├── is_regularized = true
    │   └── regularization_status = 'approved'
    │
    └─→ REJECT
        ├── status = unchanged (late/half_day)
        ├── late_by_minutes = unchanged
        └── regularization_status = 'rejected'
```

---

## 14. API ENDPOINTS

### 14.1 Accounts

```
POST   /accounts/login/
GET    /accounts/logout/
POST   /accounts/change-password/
```

### 14.2 Organizations

```
# Organizations (SUPER_ADMIN only)
GET    /organizations/
POST   /organizations/create/
GET    /organizations/<id>/edit/
POST   /organizations/<id>/delete/

# Departments
GET    /organizations/departments/
POST   /organizations/departments/create/
GET    /organizations/departments/<id>/edit/
POST   /organizations/departments/<id>/delete/

# Branches
GET    /organizations/branches/
POST   /organizations/branches/create/
GET    /organizations/branches/<id>/edit/
POST   /organizations/branches/<id>/delete/

# Shifts
GET    /organizations/shifts/
POST   /organizations/shifts/create/
GET    /organizations/shifts/<id>/edit/
POST   /organizations/shifts/<id>/delete/
```

### 14.3 Employees

```
GET    /employees/
POST   /employees/create/
GET    /employees/<id>/edit/
POST   /employees/<id>/delete/
```

### 14.4 Attendance

```
# Employee views
GET    /attendance/                    # Dashboard
POST   /attendance/checkin/            # Manual check-in
POST   /attendance/checkout/           # Checkout
GET    /attendance/history/            # Personal history

# QR System
GET    /attendance/qr/generate/        # Select branch, generate QR
GET    /attendance/qr/display/<branch_id>/  # Auto-refresh display
GET    /attendance/qr/scan/?token=xyz  # Employee check-in page
POST   /attendance/qr/scan/            # Submit check-in

# Manager/HR views
GET    /attendance/list/               # All attendance
GET    /attendance/pending/            # Pending regularizations
POST   /attendance/<id>/approve/       # Approve regularization
POST   /attendance/<id>/reject/        # Reject regularization

# Check-in approvals
GET    /attendance/checkin/pending/    # Pending check-ins
POST   /attendance/checkin/<id>/approve/  # Approve check-in
POST   /attendance/checkin/<id>/reject/   # Reject check-in
```

---

## 15. SECURITY & PERMISSIONS

### 15.1 Permission Matrix

| Feature | SUPER_ADMIN | ORG_ADMIN | HR_ADMIN | MANAGER | EMPLOYEE |
|---------|-------------|-----------|----------|---------|----------|
| **Organizations** |
| Create/Edit Org | ✓ | ✗ | ✗ | ✗ | ✗ |
| View All Orgs | ✓ | ✗ | ✗ | ✗ | ✗ |
| **Settings** |
| Departments | ✓ | ✓ | ✗ | ✗ | ✗ |
| Branches | ✓ | ✓ | ✗ | ✗ | ✗ |
| Shifts | ✓ | ✓ | ✗ | ✗ | ✗ |
| **Employees** |
| Create Employee | ✓ | ✓ | ✓ | ✗ | ✗ |
| View All Emp | ✓ | ✓ | ✓ | Team | Self |
| Edit Employee | ✓ | ✓ | ✓ | ✗ | Self (limited) |
| **Attendance** |
| Check-in | ✓ | ✓ | ✓ | ✓ | ✓ |
| View Attendance | ✓ All | ✓ Org | ✓ Org | ✓ Team | ✓ Self |
| Approve Check-in | ✓ | ✓ | ✓ | ✓ Team | ✗ |
| Approve Regular | ✓ | ✓ | ✓ | ✓ Team | ✗ |
| Generate QR | ✓ | ✓ | ✓ | ✗ | ✗ |

### 15.2 Data Access Rules

```python
# SUPER_ADMIN
- Can access all organizations
- Can switch between organizations
- No data isolation

# ORG_ADMIN
- Can access only their organization
- Full CRUD within organization
- Cannot access other organizations

# HR_ADMIN
- Can access only their organization
- Cannot modify organization settings
- Cannot create users above their role

# MANAGER
- Can access only their team (reporting_manager = self)
- Can approve team attendance/leave
- Cannot access other teams

# EMPLOYEE
- Can access only own data
- Cannot view other employees
- Can request but not approve
```

### 15.3 CSRF Protection

```python
# All POST requests require CSRF token
# Django middleware automatically validates

# In forms:
<form method="post">
    {% csrf_token %}
    ...
</form>

# In AJAX (if needed):
headers: {
    'X-CSRFToken': getCookie('csrftoken')
}
```

### 15.4 SQL Injection Prevention

```python
# Django ORM automatically escapes queries
# NEVER use raw SQL unless absolutely necessary

# Safe (ORM):
Employee.objects.filter(employee_id=user_input)

# Unsafe (avoid):
cursor.execute(f"SELECT * FROM employee WHERE id = {user_input}")

# If raw SQL needed, use parameterized queries:
cursor.execute("SELECT * FROM employee WHERE id = %s", [user_input])
```

---

## 16. FILE STRUCTURE

```
hr_system/
├── manage.py
├── requirements.txt
├── .env
├── .gitignore
│
├── config/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
│
├── apps/
│   ├── __init__.py
│   │
│   ├── accounts/
│   │   ├── __init__.py
│   │   ├── models.py          # User model
│   │   ├── views.py           # Login, logout, password
│   │   ├── forms.py           # Auth forms
│   │   ├── urls.py
│   │   ├── admin.py
│   │   ├── decorators.py      # role_required
│   │   └── migrations/
│   │
│   ├── organizations/
│   │   ├── __init__.py
│   │   ├── models.py          # Org, Dept, Branch, Shift
│   │   ├── views.py           # CRUD views
│   │   ├── forms.py
│   │   ├── urls.py
│   │   ├── admin.py
│   │   └── migrations/
│   │
│   ├── employees/
│   │   ├── __init__.py
│   │   ├── models.py          # Employee
│   │   ├── views.py
│   │   ├── forms.py
│   │   ├── urls.py
│   │   ├── admin.py
│   │   └── migrations/
│   │
│   └── attendance/
│       ├── __init__.py
│       ├── models.py          # Attendance, QRToken
│       ├── views.py           # Check-in, QR, approvals
│       ├── forms.py
│       ├── urls.py
│       ├── admin.py
│       ├── qr_utils.py        # QR generation
│       ├── geo_utils.py       # Haversine formula
│       └── migrations/
│
├── templates/
│   ├── base.html
│   ├── components/
│   │   ├── navbar.html
│   │   ├── sidebar.html
│   │   └── messages.html
│   │
│   ├── accounts/
│   │   ├── login.html
│   │   ├── change_password.html
│   │   └── dashboard.html
│   │
│   ├── organizations/
│   │   ├── organization_list.html
│   │   ├── organization_form.html
│   │   ├── department_list.html
│   │   ├── branch_list.html
│   │   └── shift_list.html
│   │
│   ├── employees/
│   │   ├── employee_list.html
│   │   └── employee_form.html
│   │
│   └── attendance/
│       ├── dashboard.html
│       ├── history.html
│       ├── list.html
│       ├── select_branch_qr.html
│       ├── qr_display.html           # Auto-refresh
│       ├── qr_scan.html              # Employee check-in
│       ├── pending_regularizations.html
│       ├── pending_checkin_approvals.html
│       └── request_regularization.html
│
├── static/
│   ├── css/
│   │   └── custom.css
│   └── js/
│       └── custom.js
│
└── media/
    ├── org_logos/
    ├── employee_photos/
    └── qr_codes/
```

---

## 17. DEPLOYMENT GUIDE

### 17.1 Environment Setup

```bash
# Create virtual environment
python -m venv venv

# Activate
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt
```

### 17.2 Environment Variables

```bash
# .env
DEBUG=False
SECRET_KEY=your-long-random-secret-key-here
DATABASE_URL=postgresql://user:pass@host:5432/dbname
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
```

### 17.3 Database Setup

```bash
# Create PostgreSQL database
createdb hr_system

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser
```

### 17.4 Static Files

```bash
# Collect static files for production
python manage.py collectstatic --no-input
```

### 17.5 Production Server (Gunicorn)

```bash
# Install Gunicorn
pip install gunicorn

# Run
gunicorn config.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 4 \
    --timeout 60
```

### 17.6 Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /static/ {
        alias /path/to/staticfiles/;
    }
    
    location /media/ {
        alias /path/to/media/;
    }
}
```

---

## 18. TROUBLESHOOTING

### 18.1 Common Issues

#### Issue: "no such column: organizations_organization.geo_fence_radius"

**Cause:** Migrations not run after model changes

**Solution:**
```bash
python manage.py makemigrations organizations
python manage.py makemigrations attendance
python manage.py migrate
```

#### Issue: QR token migration asks for default

**Cause:** Adding non-nullable branch field to existing records

**Solution:**
```bash
# Option 1: During migration
Select option 1, enter 1 as default

# Option 2: Delete old tokens first
python manage.py shell
>>> from apps.attendance.models import QRToken
>>> QRToken.objects.all().delete()
>>> exit()
python manage.py migrate
```

#### Issue: Form dropdowns show all organizations

**Cause:** Form not filtering by user's organization

**Solution:** Pass `user=request.user` to form:
```python
form = EmployeeForm(request.POST, user=request.user)
```

#### Issue: Location not obtained in QR check-in

**Cause:** HTTPS required for geolocation API

**Solution:**
- Use HTTPS in production
- In development, use localhost (exempt from HTTPS requirement)
- User must grant location permission

### 18.2 Debug Mode

```python
# settings.py
DEBUG = True  # Development only

# Shows detailed error pages
# NEVER use DEBUG=True in production
```

### 18.3 Database Reset (Development)

```bash
# WARNING: Deletes all data
rm db.sqlite3
python manage.py migrate
python manage.py createsuperuser
```

---

## APPENDIX A: DEFAULT CREDENTIALS

```
Email: admin@hrms.com
Password: admin123
Role: SUPER_ADMIN

# Created by:
python manage.py createsuperuser
```

---

## APPENDIX B: Sample Data

```python
# Create sample organization
org = Organization.objects.create(
    name='Tech Corp',
    slug='tech-corp',
    geo_fence_radius=50,
    qr_refresh_interval=5
)

# Create branch with location
branch = Branch.objects.create(
    organization=org,
    name='Head Office',
    code='HO',
    latitude=26.912434,
    longitude=75.787270,
    geo_fence_radius=100
)

# Create shift
shift = Shift.objects.create(
    organization=org,
    name='General',
    code='GEN',
    start_time='09:00',
    end_time='18:00',
    grace_period_minutes=15
)
```

---

## APPENDIX C: Future Enhancements (Module 5+)

### Module 5: Leave Management
- Leave types configuration
- Leave balance tracking
- Apply leave with calendar
- Manager/HR approval
- Sandwich rule
- Carry forward

### Module 6: Salary Management
- Salary components
- Statutory deductions (PF, ESI, Tax)
- Attendance-based calculation
- Salary slip generation
- Bank transfer file

### Module 7: Reports
- Monthly attendance summary
- Department-wise reports
- Salary register
- PF/ESI challans
- Custom report builder

---

**END OF TECHNICAL DOCUMENTATION**

*Document Version: 1.0*  
*Last Updated: December 24, 2025*  
*Author: System Development Team*
