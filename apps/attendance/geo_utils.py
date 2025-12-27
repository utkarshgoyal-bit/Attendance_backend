# apps/attendance/geo_utils.py
import math


def calculate_distance(lat1, lon1, lat2, lon2):
    """
    Calculate distance between two coordinates using Haversine formula
    
    Args:
        lat1 (float): Latitude of first point
        lon1 (float): Longitude of first point
        lat2 (float): Latitude of second point
        lon2 (float): Longitude of second point
    
    Returns:
        float: Distance in meters
    """
    # Earth radius in meters
    R = 6371000
    
    # Convert degrees to radians
    lat1_rad = math.radians(float(lat1))
    lat2_rad = math.radians(float(lat2))
    delta_lat = math.radians(float(lat2) - float(lat1))
    delta_lon = math.radians(float(lon2) - float(lon1))
    
    # Haversine formula
    a = (math.sin(delta_lat / 2) ** 2 +
         math.cos(lat1_rad) * math.cos(lat2_rad) *
         math.sin(delta_lon / 2) ** 2)
    
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c
    
    return distance


def is_within_geofence(user_lat, user_lon, office_lat, office_lon, radius):
    """
    Check if user is within geo-fence radius of office
    
    Args:
        user_lat (float): User's latitude
        user_lon (float): User's longitude
        office_lat (float): Office latitude
        office_lon (float): Office longitude
        radius (int): Allowed radius in meters
    
    Returns:
        tuple: (within_fence: bool, distance: float)
    """
    distance = calculate_distance(user_lat, user_lon, office_lat, office_lon)
    within_fence = distance <= radius
    
    return within_fence, distance