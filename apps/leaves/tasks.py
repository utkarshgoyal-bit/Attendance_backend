@shared_task
def auto_credit_monthly_leaves():
    """
    Credits monthly leave quotas to all active employees.
    """
    from apps.employees.models import Employee
    from apps.leaves.models import LeaveBalance, LeaveType
    
    # Logic: Credit 1 day for CL/SL if accrual_method is 'MONTHLY'
    monthly_types = LeaveType.objects.filter(accrual_method='MONTHLY', is_active=True)
    
    for leave_type in monthly_types:
        employees = Employee.objects.filter(
            organization=leave_type.organization, 
            is_active=True
        )
        for emp in employees:
            balance, _ = LeaveBalance.objects.get_or_create(
                employee=emp, 
                leave_type=leave_type
            )
            balance.credited += 1 # Standard monthly credit
            balance.save()