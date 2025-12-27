from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.utils import timezone
from django.http import HttpResponse  # ADD THIS LINE HERE
from datetime import datetime, time, timedelta
from apps.accounts.decorators import role_required
from apps.employees.models import Employee
from apps.organizations.models import Organization, Branch
from .models import Attendance, QRToken
from .qr_utils import generate_qr_token, generate_qr_code


@login_required
def attendance_dashboard(request):
    """Main attendance dashboard"""
    if hasattr(request.user, 'employee'):
        employee = request.user.employee
        today = timezone.now().date()
        
        # Get today's attendance
        try:
            today_attendance = Attendance.objects.get(employee=employee, date=today)
        except Attendance.DoesNotExist:
            today_attendance = None
        
        # Get this month's attendance
        month_attendance = Attendance.objects.filter(
            employee=employee,
            date__year=today.year,
            date__month=today.month
        )
        
        context = {
            'today_attendance': today_attendance,
            'month_attendance': month_attendance,
            'total_present': month_attendance.filter(status__in=['present', 'late', 'wfh']).count(),
            'total_absent': month_attendance.filter(status='absent').count(),
            'total_late': month_attendance.filter(status='late').count(),
        }
    else:
        context = {}
    
    return render(request, 'attendance/dashboard.html', context)


@login_required
def checkin(request):
    """Employee check-in"""
    if not hasattr(request.user, 'employee'):
        messages.error(request, 'You are not assigned as an employee')
        return redirect('dashboard')
    
    employee = request.user.employee
    today = timezone.now().date()
    now = timezone.now()
    
    # Check if already checked in today
    if Attendance.objects.filter(employee=employee, date=today).exists():
        messages.warning(request, 'You have already checked in today')
        return redirect('attendance:dashboard')
    
    # Get employee's shift
    if not employee.shift:
        messages.error(request, 'No shift assigned. Contact HR.')
        return redirect('attendance:dashboard')
    
    shift = employee.shift
    shift_start = datetime.combine(today, shift.start_time)
    shift_start = timezone.make_aware(shift_start)
    
    # Calculate late minutes
    late_minutes = max(0, int((now - shift_start).total_seconds() / 60))
    
    # Determine status
    if late_minutes <= shift.grace_period_minutes:
        status = 'present'
    elif late_minutes <= 120:  # 2 hours
        status = 'late'
    else:
        status = 'half_day'
    
    # Create attendance record
    attendance = Attendance.objects.create(
        employee=employee,
        date=today,
        check_in_time=now,
        check_in_method='manual',
        status=status,
        late_by_minutes=late_minutes if status in ['late', 'half_day'] else 0
    )
    
    messages.success(request, f'Checked in successfully at {now.strftime("%I:%M %p")}. Status: {status.upper()}')
    return redirect('attendance:dashboard')


@login_required
def checkout(request):
    """Employee check-out"""
    if not hasattr(request.user, 'employee'):
        messages.error(request, 'You are not assigned as an employee')
        return redirect('dashboard')
    
    employee = request.user.employee
    today = timezone.now().date()
    now = timezone.now()
    
    try:
        attendance = Attendance.objects.get(employee=employee, date=today)
    except Attendance.DoesNotExist:
        messages.error(request, 'You have not checked in today')
        return redirect('attendance:dashboard')
    
    if attendance.check_out_time:
        messages.warning(request, 'You have already checked out today')
        return redirect('attendance:dashboard')
    
    # Update checkout time
    attendance.check_out_time = now
    
    # Calculate working hours
    if attendance.check_in_time:
        time_diff = now - attendance.check_in_time
        attendance.working_hours = round(time_diff.total_seconds() / 3600, 2)
    
    attendance.save()
    
    messages.success(request, f'Checked out successfully at {now.strftime("%I:%M %p")}. Working hours: {attendance.working_hours}')
    return redirect('attendance:dashboard')


@login_required
def attendance_history(request):
    """View attendance history"""
    if not hasattr(request.user, 'employee'):
        messages.error(request, 'You are not assigned as an employee')
        return redirect('dashboard')
    
    employee = request.user.employee
    attendances = Attendance.objects.filter(employee=employee).order_by('-date')[:30]
    
    return render(request, 'attendance/history.html', {'attendances': attendances})


@login_required
@role_required(['SUPER_ADMIN', 'ORG_ADMIN', 'HR_ADMIN', 'MANAGER'])
def attendance_list(request):
    """View all attendance records"""
    if request.user.role == 'SUPER_ADMIN':
        attendances = Attendance.objects.all()
    elif request.user.role == 'MANAGER':
        # Get employees reporting to this manager
        manager_employee = request.user.employee
        team_employees = Employee.objects.filter(reporting_manager=manager_employee)
        attendances = Attendance.objects.filter(employee__in=team_employees)
    else:
        attendances = Attendance.objects.filter(employee__organization=request.user.organization)
    
    # Filter by date if provided
    date_filter = request.GET.get('date')
    if date_filter:
        attendances = attendances.filter(date=date_filter)
    else:
        # Default to today
        attendances = attendances.filter(date=timezone.now().date())
    
    attendances = attendances.select_related('employee').order_by('-date', 'employee__first_name')
    
    return render(request, 'attendance/list.html', {'attendances': attendances, 'date_filter': date_filter})


@login_required
def request_regularization(request, pk):
    """Request attendance regularization"""
    attendance = get_object_or_404(Attendance, pk=pk)
    
    # Check if user owns this attendance
    if not hasattr(request.user, 'employee') or attendance.employee != request.user.employee:
        messages.error(request, 'Unauthorized')
        return redirect('attendance:dashboard')
    
    if request.method == 'POST':
        reason = request.POST.get('reason')
        if not reason:
            messages.error(request, 'Please provide a reason')
            return redirect('attendance:history')
        
        attendance.regularization_reason = reason
        attendance.regularization_status = 'pending'
        attendance.regularization_requested_at = timezone.now()
        attendance.save()
        
        messages.success(request, 'Regularization request submitted')
        return redirect('attendance:history')
    
    return render(request, 'attendance/request_regularization.html', {'attendance': attendance})


@login_required
@role_required(['SUPER_ADMIN', 'ORG_ADMIN', 'HR_ADMIN', 'MANAGER'])
def pending_regularizations(request):
    """View pending regularization requests"""
    if request.user.role == 'MANAGER':
        manager_employee = request.user.employee
        team_employees = Employee.objects.filter(reporting_manager=manager_employee)
        attendances = Attendance.objects.filter(
            employee__in=team_employees,
            regularization_status='pending'
        )
    else:
        attendances = Attendance.objects.filter(
            employee__organization=request.user.organization,
            regularization_status='pending'
        )
    
    attendances = attendances.select_related('employee').order_by('-regularization_requested_at')
    
    return render(request, 'attendance/pending_regularizations.html', {'attendances': attendances})


@login_required
@role_required(['SUPER_ADMIN', 'ORG_ADMIN', 'HR_ADMIN', 'MANAGER'])
def approve_regularization(request, pk):
    """Approve regularization request"""
    attendance = get_object_or_404(Attendance, pk=pk)
    
    attendance.regularization_status = 'approved'
    attendance.regularization_approved_by = request.user
    attendance.regularization_approved_at = timezone.now()
    attendance.is_regularized = True
    attendance.status = 'present'  # Change status to present
    attendance.save()
    
    messages.success(request, 'Regularization approved')
    return redirect('attendance:pending_regularizations')


@login_required
@role_required(['SUPER_ADMIN', 'ORG_ADMIN', 'HR_ADMIN', 'MANAGER'])
def reject_regularization(request, pk):
    """Reject regularization request"""
    attendance = get_object_or_404(Attendance, pk=pk)
    
    if request.method == 'POST':
        remarks = request.POST.get('remarks', '')
        attendance.regularization_status = 'rejected'
        attendance.regularization_approved_by = request.user
        attendance.regularization_approved_at = timezone.now()
        attendance.regularization_remarks = remarks
        attendance.save()
        
        messages.success(request, 'Regularization rejected')
        return redirect('attendance:pending_regularizations')
    
    return render(request, 'attendance/reject_regularization.html', {'attendance': attendance})


@login_required
@role_required(['SUPER_ADMIN', 'ORG_ADMIN', 'HR_ADMIN'])
def generate_qr_view(request):
    """Generate QR code for branch"""
    
    # Get organization and branches
    if request.user.role == 'SUPER_ADMIN':
        if request.method == 'POST':
            branch_id = request.POST.get('branch')
            branch = Branch.objects.select_related('organization').get(pk=branch_id)
            org = branch.organization
        else:
            branches = Branch.objects.filter(is_active=True).select_related('organization')
            return render(request, 'attendance/select_branch_qr.html', {'branches': branches})
    else:
        org = request.user.organization
        if request.method == 'POST':
            branch_id = request.POST.get('branch')
            branch = Branch.objects.get(pk=branch_id, organization=org)
        else:
            branches = Branch.objects.filter(organization=org, is_active=True)
            return render(request, 'attendance/select_branch_qr.html', {'branches': branches})
    
    # Generate token
    token = generate_qr_token()
    refresh_interval = org.qr_refresh_interval  # Get from org settings
    expires_at = timezone.now() + timedelta(minutes=refresh_interval)
    
    # Deactivate old tokens for this branch
    QRToken.objects.filter(branch=branch, is_active=True).update(is_active=False)
    
    # Save new token
    QRToken.objects.create(
        token=token,
        organization=org,
        branch=branch,
        expires_at=expires_at
    )
    
    # Generate QR code with branch info (INDENT THIS PROPERLY)
    base_url = request.build_absolute_uri('/')[:-1]  # Remove trailing slash
    url = f"{base_url}/attendance/qr/scan/?token={token}"
    qr_image = generate_qr_code(url)
    
    # Return image
    response = HttpResponse(qr_image.read(), content_type='image/png')
    response['Content-Disposition'] = f'inline; filename="qr_{branch.code}_{token[:8]}.png"'
    return response


def qr_checkin(request):
    """Employee check-in via QR scan - Public access"""
    
    token = request.GET.get('token')
    
    if not token:
        return render(request, 'attendance/qr_scan.html', {'error': 'Invalid QR code'})
    
    # Validate QR token
    try:
        qr_token = QRToken.objects.select_related('organization', 'branch').get(token=token)
    except QRToken.DoesNotExist:
        return render(request, 'attendance/qr_scan.html', {'error': 'Invalid QR code'})
    
    if not qr_token.is_valid():
        return render(request, 'attendance/qr_scan.html', {
            'error': 'QR code expired. Please ask reception to refresh the QR code.'
        })
    
    organization = qr_token.organization
    branch = qr_token.branch
    
    # Handle POST request
    if request.method == 'POST':
        employee_id = request.POST.get('employee_id')
        user_lat = request.POST.get('latitude')
        user_lon = request.POST.get('longitude')
        
        if not employee_id:
            return render(request, 'attendance/qr_scan.html', {
                'token': token,
                'branch': branch,
                'error': 'Please enter your Employee ID'
            })
        
        # Find employee
        try:
            employee = Employee.objects.select_related('user', 'shift', 'branch').get(
                employee_id=employee_id, 
                organization=organization, 
                is_active=True
            )
        except Employee.DoesNotExist:
            return render(request, 'attendance/qr_scan.html', {
                'token': token,
                'branch': branch,
                'error': f'Employee ID "{employee_id}" not found'
            })
        
        # Check if already checked in
        today = timezone.now().date()
        if Attendance.objects.filter(employee=employee, date=today).exists():
            return render(request, 'attendance/qr_scan.html', {
                'token': token,
                'branch': branch,
                'error': 'You have already checked in today'
            })
        
        # Validate geo-location using BRANCH location
        if organization.require_geo_validation:
            if not user_lat or not user_lon:
                return render(request, 'attendance/qr_scan.html', {
                    'token': token,
                    'branch': branch,
                    'error': 'Location access required. Please enable location.'
                })
            
            # Use branch location
            office_lat = branch.latitude
            office_lon = branch.longitude
            radius = branch.geo_fence_radius if branch.geo_fence_radius else organization.geo_fence_radius
            
            if not office_lat or not office_lon:
                return render(request, 'attendance/qr_scan.html', {
                    'token': token,
                    'branch': branch,
                    'error': f'{branch.name} location not configured. Contact HR.'
                })
            
            from .geo_utils import is_within_geofence
            
            within_fence, distance = is_within_geofence(
                float(user_lat), float(user_lon),
                float(office_lat), float(office_lon),
                radius
            )
            
            if not within_fence:
                return render(request, 'attendance/qr_scan.html', {
                    'token': token,
                    'branch': branch,
                    'error': f'You are {int(distance)}m away. Must be within {radius}m of {branch.name}.'
                })
        
        # Check shift
        if not employee.shift:
            return render(request, 'attendance/qr_scan.html', {
                'token': token,
                'branch': branch,
                'error': 'No shift assigned. Contact HR.'
            })
        
        # Calculate status
        now = timezone.now()
        shift = employee.shift
        shift_start = datetime.combine(today, shift.start_time)
        shift_start = timezone.make_aware(shift_start)
        
        late_minutes = max(0, int((now - shift_start).total_seconds() / 60))
        
        if late_minutes <= shift.grace_period_minutes:
            status = 'present'
        elif late_minutes <= 120:
            status = 'late'
        else:
            status = 'half_day'
        
        # Check if approval required (only for EMPLOYEE role)
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
            late_by_minutes=late_minutes if status in ['late', 'half_day'] else 0,
            check_in_latitude=user_lat if user_lat else None,
            check_in_longitude=user_lon if user_lon else None,
            requires_approval=requires_approval
        )
        
        # Success
        if requires_approval:
            return render(request, 'attendance/qr_scan.html', {
                'success': True,
                'branch': branch,
                'message': 'Check-in request sent for approval',
                'time': now.strftime("%I:%M %p"),
                'status': 'Pending Approval'
            })
        else:
            return render(request, 'attendance/qr_scan.html', {
                'success': True,
                'branch': branch,
                'message': 'Check-in successful!',
                'time': now.strftime("%I:%M %p"),
                'status': status.replace('_', ' ').title()
            })
    
    # GET request
    return render(request, 'attendance/qr_scan.html', {
        'token': token,
        'branch': branch
    })


@login_required
@role_required(['SUPER_ADMIN', 'ORG_ADMIN', 'HR_ADMIN', 'MANAGER'])
def pending_checkin_approvals(request):
    """View pending check-in requests"""
    if request.user.role == 'MANAGER':
        manager_employee = request.user.employee
        team_employees = Employee.objects.filter(reporting_manager=manager_employee)
        attendances = Attendance.objects.filter(
            employee__in=team_employees,
            status='pending_approval'
        )
    else:
        attendances = Attendance.objects.filter(
            employee__organization=request.user.organization,
            status='pending_approval'
        )
    
    attendances = attendances.select_related('employee').order_by('-check_in_time')
    
    return render(request, 'attendance/pending_checkin_approvals.html', {'attendances': attendances})


@login_required
@role_required(['SUPER_ADMIN', 'ORG_ADMIN', 'HR_ADMIN', 'MANAGER'])
def approve_checkin(request, pk):
    """Approve check-in request"""
    attendance = get_object_or_404(Attendance, pk=pk)
    
    # Recalculate status based on time
    shift = attendance.employee.shift
    today = attendance.date
    shift_start = datetime.combine(today, shift.start_time)
    shift_start = timezone.make_aware(shift_start)
    
    late_minutes = max(0, int((attendance.check_in_time - shift_start).total_seconds() / 60))
    
    if late_minutes <= shift.grace_period_minutes:
        status = 'present'
    elif late_minutes <= 120:
        status = 'late'
    else:
        status = 'half_day'
    
    attendance.status = status
    attendance.approved_by = request.user
    attendance.approved_at = timezone.now()
    attendance.save()
    
    messages.success(request, f'Check-in approved for {attendance.employee.first_name} {attendance.employee.last_name}')
    return redirect('attendance:pending_checkin_approvals')


@login_required
@role_required(['SUPER_ADMIN', 'ORG_ADMIN', 'HR_ADMIN', 'MANAGER'])
def reject_checkin(request, pk):
    """Reject check-in request"""
    attendance = get_object_or_404(Attendance, pk=pk)
    attendance.delete()
    
    messages.success(request, f'Check-in rejected for {attendance.employee.first_name} {attendance.employee.last_name}')
    return redirect('attendance:pending_checkin_approvals')


@login_required
@role_required(['SUPER_ADMIN', 'ORG_ADMIN', 'HR_ADMIN'])
def qr_display(request, branch_id):
    """Display QR code on screen with auto-refresh"""
    branch = get_object_or_404(Branch, pk=branch_id)
    
    # Check permission
    if request.user.role != 'SUPER_ADMIN' and branch.organization != request.user.organization:
        messages.error(request, 'Access denied')
        return redirect('dashboard')
    
    org = branch.organization
    refresh_interval = org.qr_refresh_interval * 60 * 1000  # Convert to milliseconds
    
    return render(request, 'attendance/qr_display.html', {
        'branch': branch,
        'organization': org,
        'refresh_interval': refresh_interval
    })