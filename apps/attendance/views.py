from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.utils import timezone
from datetime import datetime, time, timedelta
from apps.accounts.decorators import role_required
from apps.employees.models import Employee
from .models import Attendance
from django.http import HttpResponse
from datetime import timedelta
from .models import QRToken
from .qr_utils import generate_qr_token, generate_qr_code
from apps.organizations.models import Organization

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
    """Generate QR code for organization"""
    if request.user.role == 'SUPER_ADMIN':
        # Need to select organization
        if request.method == 'POST':
            org_id = request.POST.get('organization')
            org = Organization.objects.get(pk=org_id)
        else:
            orgs = Organization.objects.filter(is_active=True)
            return render(request, 'attendance/select_org_qr.html', {'organizations': orgs})
    else:
        org = request.user.organization
    
    # Generate token
    token = generate_qr_token()
    expires_at = timezone.now() + timedelta(hours=24)
    
    # Save token
    QRToken.objects.create(
        token=token,
        organization=org,
        expires_at=expires_at
    )
    
    # Generate QR code
    qr_image = generate_qr_code(token)
    
    # Return image
    response = HttpResponse(qr_image.read(), content_type='image/png')
    response['Content-Disposition'] = f'inline; filename="qr_{org.slug}.png"'
    return response


@login_required
def qr_checkin(request):
    """Check-in via QR code scan"""
    if not hasattr(request.user, 'employee'):
        return render(request, 'attendance/qr_scan.html', {'error': 'Not an employee'})
    
    if request.method == 'POST':
        token = request.POST.get('token')
        
        try:
            qr_token = QRToken.objects.get(token=token)
            
            if not qr_token.is_valid():
                return render(request, 'attendance/qr_scan.html', {'error': 'QR code expired'})
            
            employee = request.user.employee
            
            if employee.organization != qr_token.organization:
                return render(request, 'attendance/qr_scan.html', {'error': 'Invalid QR code for your organization'})
            
            # Perform check-in
            today = timezone.now().date()
            now = timezone.now()
            
            if Attendance.objects.filter(employee=employee, date=today).exists():
                return render(request, 'attendance/qr_scan.html', {'error': 'Already checked in today'})
            
            # Get shift and calculate status
            if not employee.shift:
                return render(request, 'attendance/qr_scan.html', {'error': 'No shift assigned'})
            
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
            
            # Create attendance
            Attendance.objects.create(
                employee=employee,
                date=today,
                check_in_time=now,
                check_in_method='qr',
                status=status,
                late_by_minutes=late_minutes if status in ['late', 'half_day'] else 0
            )
            
            return render(request, 'attendance/qr_scan.html', {
                'success': True,
                'status': status,
                'time': now.strftime("%I:%M %p")
            })
            
        except QRToken.DoesNotExist:
            return render(request, 'attendance/qr_scan.html', {'error': 'Invalid QR code'})
    
    return render(request, 'attendance/qr_scan.html')
