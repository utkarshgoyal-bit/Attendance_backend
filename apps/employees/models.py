from django.db import models
from django.conf import settings

class Employee(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='employee')
    organization = models.ForeignKey('organizations.Organization', on_delete=models.CASCADE)
    employee_id = models.CharField(max_length=20)
    
    # Professional details
    department = models.ForeignKey('organizations.Department', on_delete=models.SET_NULL, null=True)
    branch = models.ForeignKey('organizations.Branch', on_delete=models.SET_NULL, null=True)
    shift = models.ForeignKey('organizations.Shift', on_delete=models.SET_NULL, null=True)
    designation = models.CharField(max_length=100)
    reporting_manager = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True)
    
    date_of_joining = models.DateField()
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ['organization', 'employee_id']