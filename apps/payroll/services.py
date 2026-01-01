from decimal import Decimal
from django.utils import timezone
import calendar

class PayrollService:
    @staticmethod
    def calculate_monthly_salary(employee, payable_days, month=None, year=None):
        """
        Implements rigid Indian Statutory Formulas.
        """
        if not month or not year:
            now = timezone.now()
            month, year = now.month, now.year

        # 1. Base Gross Calculation
        monthly_gross = Decimal(employee.annual_ctc) / Decimal(12)
        total_days_in_month = calendar.monthrange(year, month)[1]
        
        # Pro-rata Gross based on attendance
        actual_gross = (monthly_gross / Decimal(total_days_in_month)) * Decimal(payable_days)

        # 2. Rigid Component Breakdown
        # Basic is fixed at 40% of Monthly Gross
        basic = monthly_gross * Decimal(0.40)
        # HRA is fixed at 40% of Basic
        hra = basic * Decimal(0.40)
        # Special Allowance is the balancing figure
        special_allowance = monthly_gross - (basic + hra)

        # 3. Statutory Deductions
        
        # PF Logic: 12% of (Basic + Special) capped at 15,000 wage ceiling
        pf_eligible_salary = min(basic + special_allowance, Decimal(15000))
        employee_pf = pf_eligible_salary * Decimal(0.12)
        
        # ESI Logic: 0.75% only if Gross <= 21,000
        employee_esi = Decimal(0)
        if monthly_gross <= Decimal(21000):
            employee_esi = actual_gross * Decimal(0.0075)

        # Professional Tax (PT) - Maharashtra Example Slab
        pt = Decimal(0)
        if actual_gross > Decimal(10000):
            pt = Decimal(200)
            # Special Case: February PT is usually 300
            if month == 2:
                pt = Decimal(300)

        # 4. Final Totals
        total_deductions = employee_pf + employee_esi + pt
        net_salary = actual_gross - total_deductions

        return {
            'basic': round(basic, 2),
            'hra': round(hra, 2),
            'special_allowance': round(special_allowance, 2),
            'employee_pf': round(employee_pf, 2),
            'employee_esi': round(employee_esi, 2),
            'pt': pt,
            'net_salary': round(net_salary, 2),
            'payable_days': payable_days
        }