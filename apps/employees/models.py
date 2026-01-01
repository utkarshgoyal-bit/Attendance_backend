from django.db import models
from django.conf import settings

class Employee(models.Model):
    GENDER_CHOICES = [('M', 'Male'), ('F', 'Female'), ('O', 'Other')]
    STATUS_CHOICES = [('active', 'Active'), ('inactive', 'Inactive'), ('terminated', 'Terminated')]

    # Core Links
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='employee')
    organization = models.ForeignKey('organizations.Organization', on_delete=models.CASCADE)
    employee_id = models.CharField(max_length=20)
    
    # Personal Details
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, null=True, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    
    # Professional Assignment
    department = models.ForeignKey('organizations.Department', on_delete=models.SET_NULL, null=True)
    branch = models.ForeignKey('organizations.Branch', on_delete=models.SET_NULL, null=True)
    shift = models.ForeignKey('organizations.Shift', on_delete=models.SET_NULL, null=True)
    designation = models.CharField(max_length=100)
    reporting_manager = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True)
    
    # Employment Status
    date_of_joining = models.DateField()
    employment_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ['organization', 'employee_id']
        ordering = ['first_name', 'last_name']

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.employee_id})"