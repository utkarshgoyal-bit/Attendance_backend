from celery import shared_task
from django.utils import timezone
from datetime import datetime
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Attendance
from apps.employees.models import Employee
from apps.organizations.models import Organization
from .geo_utils import is_within_geofence

@shared_task
def process_attendance_checkin(employee_id, organization_id, branch_id, user_lat, user_lon, timestamp_str):
    """
    Background worker task to process check-in logic:
    1. Distance validation
    2. Status calculation
    3. Persistence
    """
    employee = Employee.objects.get(id=employee_id)
    organization = Organization.objects.get(id=organization_id)
    now = datetime.fromisoformat(timestamp_str)
    today = now.date()
    
    # 1. Re-validate Geofence on server
    branch = employee.branch
    within_fence, distance = is_within_geofence(
        user_lat, user_lon, branch.latitude, branch.longitude, 
        branch.geo_fence_radius or organization.geo_fence_radius
    )
    
    if not within_fence:
        # In a real system, we would log a security alert here
        return {"status": "failed", "reason": "Geo-validation failed"}

    # 2. Calculate Status
    shift = employee.shift
    shift_start = timezone.make_aware(datetime.combine(today, shift.start_time))
    late_minutes = max(0, int((now - shift_start).total_seconds() / 60))
    
    status = 'present'
    if late_minutes > 120:
        status = 'half_day'
    elif late_minutes > shift.grace_period_minutes:
        status = 'late'
        
    # 3. Create Record
    Attendance.objects.create(
        employee=employee,
        date=today,
        check_in_time=now,
        check_in_method='qr_event',
        status=status,
        late_by_minutes=late_minutes if status != 'present' else 0,
        check_in_latitude=user_lat,
        check_in_longitude=user_lon
    )

    # 4. Notify via WebSockets
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        'attendance_updates',
        {
            'type': 'attendance_message',
            'data': {
                'employee_id': employee.employee_id,
                'employee_name': f"{employee.first_name} {employee.last_name}",
                'status': status.upper(),
                'check_in_time': now.strftime("%I:%M %p")
            }
        }
    )
    
    return {"status": "success", "employee": employee.employee_id}