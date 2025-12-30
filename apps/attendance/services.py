from .geo_utils import calculate_distance
from .models import Attendance

class AttendanceService:
    @staticmethod
    def process_checkin(employee, branch, lat, lon):
        # Calculate distance
        distance = calculate_distance(
            lat, lon, 
            branch.latitude, branch.longitude
        )
        
        # Logic: Verify Geo-fence
        is_within_range = distance <= branch.geo_fence_radius
        
        if is_within_range:
            return Attendance.objects.create(
                employee=employee,
                branch=branch,
                status='PRESENT'
            )
        return None