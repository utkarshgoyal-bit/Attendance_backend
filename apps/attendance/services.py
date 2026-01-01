from django.utils import timezone
from datetime import timedelta
from .geo_utils import calculate_haversine_distance # Existing utility

class AttendanceService:
    @staticmethod
    def validate_checkin(user, branch, user_lat, user_lon, is_mock=False):
        """
        Clean Logic for Check-in Validation.
        """
        # 1. Security Check: Mock Location
        if is_mock:
            return False, "Security Alert: Mock location detected. Check-in rejected."

        # 2. Geo-fencing: Haversine Calculation
        distance = calculate_haversine_distance(
            user_lat, user_lon, 
            branch.latitude, branch.longitude
        )
        
        if distance > branch.geo_fence_radius:
            return False, f"Out of Range: You are {int(distance)}m away from the branch."

        return True, "Valid"

    @staticmethod
    def can_request_regularization(attendance_date):
        """
        Enforce the 7-Day Hard Wall requirement.
        """
        limit_date = timezone.now().date() - timedelta(days=7)
        return attendance_date >= limit_date