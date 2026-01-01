from django.utils import timezone
from datetime import timedelta
from .geo_utils import calculate_haversine_distance # Existing utility
from django.utils import timezone
from datetime import timedelta

class AttendanceService:
    @staticmethod
    def validate_checkin(user, branch, user_lat, user_lon, is_mock=False):
        # Fetch dynamic settings for this specific organization
        settings = user.organization.settings
        
        # 1. Dynamic Security Check
        if is_mock and not settings.allow_mock_location:
            return False, "Security Alert: Mock location detected. Check-in rejected."

        # 2. Dynamic Geo-fencing
        # Use settings.geo_fence_radius_m instead of a hard-coded 100
        distance = calculate_haversine_distance(user_lat, user_lon, branch.latitude, branch.longitude)
        if distance > settings.geo_fence_radius_m:
            return False, f"Out of Range: You are {int(distance)}m away."

        return True, "Valid"

    @staticmethod
    def can_request_regularization(user, attendance_date):
        """
        Enforce the dynamic Hard Wall (e.g., 7 days or 14 days).
        """
        window = user.organization.settings.regularization_window_days
        limit_date = timezone.now().date() - timedelta(days=window)
        return attendance_date >= limit_date