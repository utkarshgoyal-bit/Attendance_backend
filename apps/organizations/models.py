from django.db import models
from django.utils.text import slugify
from django_tenants.models import TenantMixin, DomainMixin

class Organization(TenantMixin):
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, blank=True)
    
    # Required fields
    geo_fence_radius = models.IntegerField(default=50)
    require_geo_validation = models.BooleanField(default=True)
    qr_refresh_interval = models.IntegerField(default=5)
    
    # Additional fields
    require_approval_for_employees = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    auto_create_schema = True 

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.name

class Domain(DomainMixin):
    pass

class Department(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='departments')
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Branch(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='branches')
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    geo_fence_radius = models.IntegerField(default=50)
    is_active = models.BooleanField(default=True)

class Shift(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='shifts')
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20)
    start_time = models.TimeField()
    end_time = models.TimeField()
    grace_period_minutes = models.IntegerField(default=15)