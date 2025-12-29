from django.contrib import admin
from .models import Organization, Department, Branch, Shift


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ['name', 'schema_name', 'geo_fence_radius', 'qr_refresh_interval']
    list_filter = []
    search_fields = ['name', 'schema_name']


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'organization', 'is_active']
    list_filter = ['organization', 'is_active']
    search_fields = ['name', 'code']


@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'organization', 'city', 'is_active']
    list_filter = ['organization', 'is_active']
    search_fields = ['name', 'code', 'city']


@admin.register(Shift)
class ShiftAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'organization', 'start_time', 'end_time', 'is_active']
    list_filter = ['organization', 'is_active']
    search_fields = ['name', 'code']
