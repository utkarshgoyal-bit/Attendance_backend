from datetime import timedelta
from django.utils import timezone
from .models import LeaveType  # Assuming your models are defined

class LeaveService:
    @staticmethod
    def calculate_total_deduction(employee, leave_type, from_date, to_date):
        """
        Calculates how many days should be deducted from the balance.
        Implements the Sandwich Rule if enabled for the organization.
        """
        org_settings = employee.organization.settings
        
        # 1. Base Working Days Calculation
        # (This would typically exclude weekends and company holidays)
        working_days = LeaveService.get_working_days_count(employee, from_date, to_date)
        
        # 2. Check Sandwich Rule Conditions
        if org_settings.sandwich_rule_enabled:
            # If the leave spans across weekends, and the rule is on,
            # we deduct every day in the calendar range.
            total_calendar_days = (to_date - from_date).days + 1
            
            # Logic: If the employee is off on Friday and Monday, 
            # the count becomes 4 instead of 2.
            return total_calendar_days
            
        return working_days

    @staticmethod
    def get_working_days_count(employee, start, end):
        """
        Helper to count actual working days (excluding organization week-offs).
        """
        count = 0
        current_date = start
        week_offs = employee.shift.week_off_days  # e.g., ["Saturday", "Sunday"]
        
        while current_date <= end:
            if current_date.strftime('%A') not in week_offs:
                count += 1
            current_date += timedelta(days=1)
        return count