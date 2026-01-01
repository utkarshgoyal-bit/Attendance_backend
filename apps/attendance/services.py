from django.utils import timezone
from datetime import timedelta
from .geo_utils import calculate_haversine_distance
from django.contrib import messages

class AttendanceService:
    @staticmethod
    def validate_checkin(user, branch, user_lat, user_lon, is_mock=False):
        """
        Streamlined validation using dynamic organization settings.
        Includes security checks and geo-fence radius verification.
        """
        # Fetch organization-specific settings
        settings = user.organization.settings
        
        # 1. Dynamic Security Check: Mock Location
        # Prevents GPS spoofing apps from being used for attendance fraud.
        if is_mock and not settings.allow_mock_location:
            return False, "Security Alert: Mock location detected. Check-in rejected."

        # 2. Dynamic Geo-fencing
        # Calculates distance between user and branch coordinates.
        distance = calculate_haversine_distance(
            user_lat, user_lon, 
            branch.latitude, branch.longitude
        )
        
        # Implementing a 5-meter "Soft Buffer" to account for GPS drift
        # If settings say 100m, we effectively allow 105m to reduce false rejections.
        effective_radius = settings.geo_fence_radius_m + 5
        
        if distance > effective_radius:
            return False, f"Out of Range: You are {int(distance)}m away from the branch."

        return True, "Valid"

    @staticmethod
    def can_request_regularization(user, attendance_date):
        """
        Enforce the "7-Day Hard Wall" for attendance corrections.
        Prevents employees from requesting changes to old records.
        """
        # Window is dynamically fetched from organization settings
        window = user.organization.settings.regularization_window_days
        limit_date = timezone.now().date() - timedelta(days=window)
        
        return attendance_date >= limit_date

    @staticmethod
    def is_attendance_frozen(user, check_in_date):
        """
        Checks if the attendance for the month is frozen.
        Standard logic freezes attendance on the 26th for payroll processing.
        """
        settings = user.organization.settings
        current_date = timezone.now().date()
        
        # If today is past the freeze day and we are looking at the current month
        if current_date.day >= settings.attendance_freeze_day:
            if check_in_date.month == current_date.month and check_in_date.year == current_date.year:
                return True
        return False