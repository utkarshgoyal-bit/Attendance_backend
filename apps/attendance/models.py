from django.db import models

class Attendance(models.Model):
    class Status(models.TextChoices):
        PRESENT = 'present', 'Present'
        LATE = 'late', 'Late'
        HALF_DAY = 'half_day', 'Half Day'
        ABSENT = 'absent', 'Absent'
        PENDING_APPROVAL = 'pending_approval', 'Pending Approval'

    METHOD_CHOICES = [
        ('manual', 'Manual'),
        ('qr', 'QR Scan'),
        ('geo', 'Geo-location'),
    ]

    employee = models.ForeignKey('employees.Employee', on_delete=models.CASCADE)
    date = models.DateField()
    check_in_time = models.DateTimeField(null=True, blank=True)
    check_out_time = models.DateTimeField(null=True, blank=True)
    
    # Required for Admin and Logic
    check_in_method = models.CharField(max_length=20, choices=METHOD_CHOICES, default='manual')
    working_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    
    status = models.CharField(max_length=20, choices=Status.choices)
    check_in_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    check_in_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    class Meta:
        unique_together = ['employee', 'date']

    def __str__(self):
        return f"{self.employee} - {self.date}"

class QRToken(models.Model):
    token = models.CharField(max_length=100, unique=True)
    organization = models.ForeignKey('organizations.Organization', on_delete=models.CASCADE)
    branch = models.ForeignKey('organizations.Branch', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'QR Token'
        verbose_name_plural = 'QR Tokens'