from celery import shared_task
from django.utils import timezone
from apps.attendance.models import Attendance
from apps.organizations.models import OrgSettings

@shared_task
def execute_monthly_attendance_freeze():
    """
    Automated task to lock attendance on the 26th of the month.
    """
    today = timezone.now().date()
    # Find all organizations that have the freeze day set to today
    settings_to_freeze = OrgSettings.objects.filter(attendance_freeze_day=today.day)
    
    for setting in settings_to_freeze:
        # Update all attendance records for the current month to 'frozen'
        Attendance.objects.filter(
            employee__organization=setting.organization,
            date__month=today.month,
            date__year=today.year
        ).update(is_frozen=True)
        
        # Log the system-wide action in the Audit Log
        print(f"Attendance frozen for {setting.organization.name} on {today}")
        