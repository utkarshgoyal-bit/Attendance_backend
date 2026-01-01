from datetime import timedelta

class LeaveService:
    @staticmethod
    def calculate_leave_deduction(employee, start_date, end_date):
        """
        Calculates total days to deduct, applying the Sandwich Rule if enabled.
        """
        settings = employee.organization.settings
        total_days = (end_date - start_date).days + 1
        
        if not settings.sandwich_rule_enabled:
            # Logic to count only working days (excluding weekends/holidays)
            return LeaveService._get_working_days(start_date, end_date, employee.organization)
            
        # If Sandwich Rule is enabled, we deduct the full range including weekends
        return total_days

    @staticmethod
    def _get_working_days(start_date, end_date, organization):
        # Implementation to check branch-specific holidays and shift-off days
        pass