from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from apps.accounts.decorators import role_required
from .models import Organization, Department, Branch, Shift, OrgSettings
from .forms import OrganizationForm, DepartmentForm, BranchForm, ShiftForm

@login_required
@role_required(['SUPER_ADMIN', 'ORG_ADMIN'])
def organization_dashboard(request):
    """View to display organization-specific settings and overview."""
    org = request.user.organization
    settings, created = OrgSettings.objects.get_or_create(organization=org)
    
    return render(request, 'organizations/dashboard.html', {
        'organization': org,
        'settings': settings,
    })

@login_required
@role_required(['SUPER_ADMIN', 'ORG_ADMIN'])
def branch_list(request):
    """List all branches for the current organization."""
    branches = Branch.objects.filter(organization=request.user.organization)
    return render(request, 'organizations/branch_list.html', {'branches': branches})

@login_required
@role_required(['SUPER_ADMIN', 'ORG_ADMIN'])
def shift_list(request):
    """List all shifts for the current organization."""
    shifts = Shift.objects.filter(organization=request.user.organization)
    return render(request, 'organizations/shift_list.html', {'shifts': shifts})

@login_required
@role_required(['SUPER_ADMIN', 'ORG_ADMIN'])
def department_list(request):
    """List all departments for the current organization."""
    departments = Department.objects.filter(organization=request.user.organization)
    return render(request, 'organizations/department_list.html', {'departments': departments})