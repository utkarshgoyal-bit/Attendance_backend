from django.db import models
from apps.employees.models import Employee
from apps.accounts.models import User


class Attendance(models.Model):
    class Status(models.TextChoices):
        PRESENT = 'present', 'Present'
        LATE = 'late', 'Late'
        HALF_DAY = 'half_day', 'Half Day'
        ABSENT = 'absent', 'Absent'
        WEEK_OFF = 'week_off', 'Week Off'
        HOLIDAY = 'holiday', 'Holiday'
        ON_LEAVE = 'on_leave', 'On Leave'
        WFH = 'wfh', 'Work From Home'
    
    class CheckInMethod(models.TextChoices):
        MANUAL = 'manual', 'Manual'
        GEO = 'geo', 'Geo Location'
        QR = 'qr', 'QR Code'
        BIOMETRIC = 'biometric', 'Biometric'
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    date = models.DateField()
    
    check_in_time = models.DateTimeField(null=True, blank=True)
    check_out_time = models.DateTimeField(null=True, blank=True)
    check_in_method = models.CharField(max_length=20, choices=CheckInMethod.choices, default=CheckInMethod.MANUAL)
    
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ABSENT)
    
    working_hours = models.DecimalField(max_digits=4, decimal_places=2, default=0)
    late_by_minutes = models.IntegerField(default=0)
    early_by_minutes = models.IntegerField(default=0)
    
    # Location
    check_in_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    check_in_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    remarks = models.TextField(blank=True)
    
    # Regularization
    is_regularized = models.BooleanField(default=False)
    regularization_reason = models.TextField(blank=True)
    regularization_requested_at = models.DateTimeField(null=True, blank=True)
    regularization_status = models.CharField(max_length=20, blank=True)
    regularization_approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_attendances')
    regularization_approved_at = models.DateTimeField(null=True, blank=True)
    regularization_remarks = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['employee', 'date']
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.employee.first_name} {self.employee.last_name} - {self.date} - {self.status}"
