class LeaveService:
    @staticmethod
    def calculate_deduction(employee, start_date, end_date):
        """
        Implements the 'Sandwich Rule' logic.
        """
        total_days = (end_date - start_date).days + 1
        
        # Check if Org has Sandwich Rule enabled in SystemSettings
        # org_settings = employee.organization.settings
        # if not org_settings.sandwich_rule_enabled:
        #     return calculate_working_days_only(start_date, end_date)
            
        # Standard Logic: Deduct all days in the range
        return total_days