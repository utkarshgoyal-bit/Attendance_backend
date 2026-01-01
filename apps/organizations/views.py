from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from apps.accounts.decorators import role_required
from .models import Organization, Department, Branch, Shift, OrgSettings
from .forms import OrganizationForm, DepartmentForm, BranchForm, ShiftForm

# --- ORGANIZATION VIEWS ---

@login_required
@role_required(['SUPER_ADMIN'])
def organization_list(request):
    organizations = Organization.objects.all().exclude(schema_name='public')
    return render(request, 'organizations/organization_list.html', {'organizations': organizations})

@login_required
@role_required(['SUPER_ADMIN'])
def organization_create(request):
    if request.method == 'POST':
        form = OrganizationForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "Organization created successfully.")
            return redirect('organization_list')
    else:
        form = OrganizationForm()
    return render(request, 'organizations/organization_form.html', {'form': form})

@login_required
@role_required(['SUPER_ADMIN'])
def organization_edit(request, pk):
    org = get_object_or_404(Organization, pk=pk)
    if request.method == 'POST':
        form = OrganizationForm(request.POST, instance=org)
        if form.is_valid():
            form.save()
            messages.success(request, "Organization updated successfully.")
            return redirect('organization_list')
    else:
        form = OrganizationForm(instance=org)
    return render(request, 'organizations/organization_form.html', {'form': form, 'org': org})

@login_required
@role_required(['SUPER_ADMIN'])
def organization_delete(request, pk):
    org = get_object_or_404(Organization, pk=pk)
    if request.method == 'POST':
        org.delete()
        messages.success(request, "Organization deleted.")
        return redirect('organization_list')
    return render(request, 'organizations/organization_confirm_delete.html', {'org': org})

# --- BRANCH VIEWS ---

@login_required
@role_required(['ORG_ADMIN', 'HR_ADMIN'])
def branch_list(request):
    branches = Branch.objects.all()
    return render(request, 'organizations/branch_list.html', {'branches': branches})

@login_required
@role_required(['ORG_ADMIN', 'HR_ADMIN'])
def branch_create(request):
    if request.method == 'POST':
        form = BranchForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "Branch created successfully.")
            return redirect('branch_list')
    else:
        form = BranchForm()
    return render(request, 'organizations/branch_form.html', {'form': form})

@login_required
@role_required(['ORG_ADMIN', 'HR_ADMIN'])
def branch_edit(request, pk):
    branch = get_object_or_404(Branch, pk=pk)
    if request.method == 'POST':
        form = BranchForm(request.POST, instance=branch)
        if form.is_valid():
            form.save()
            messages.success(request, "Branch updated.")
            return redirect('branch_list')
    else:
        form = BranchForm(instance=branch)
    return render(request, 'organizations/branch_form.html', {'form': form})

@login_required
@role_required(['ORG_ADMIN', 'HR_ADMIN'])
def branch_delete(request, pk):
    branch = get_object_or_404(Branch, pk=pk)
    branch.delete()
    messages.success(request, "Branch deleted.")
    return redirect('branch_list')

# --- DEPARTMENT VIEWS ---

@login_required
@role_required(['ORG_ADMIN', 'HR_ADMIN'])
def department_list(request):
    departments = Department.objects.all()
    return render(request, 'organizations/department_list.html', {'departments': departments})

@login_required
@role_required(['ORG_ADMIN', 'HR_ADMIN'])
def department_create(request):
    if request.method == 'POST':
        form = DepartmentForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "Department created.")
            return redirect('department_list')
    else:
        form = DepartmentForm()
    return render(request, 'organizations/department_form.html', {'form': form})

@login_required
@role_required(['ORG_ADMIN', 'HR_ADMIN'])
def department_edit(request, pk):
    dept = get_object_or_404(Department, pk=pk)
    if request.method == 'POST':
        form = DepartmentForm(request.POST, instance=dept)
        if form.is_valid():
            form.save()
            messages.success(request, "Department updated.")
            return redirect('department_list')
    else:
        form = DepartmentForm(instance=dept)
    return render(request, 'organizations/department_form.html', {'form': form})

@login_required
@role_required(['ORG_ADMIN', 'HR_ADMIN'])
def department_delete(request, pk):
    dept = get_object_or_404(Department, pk=pk)
    dept.delete()
    messages.success(request, "Department deleted.")
    return redirect('department_list')

# --- SHIFT VIEWS ---

@login_required
@role_required(['ORG_ADMIN', 'HR_ADMIN'])
def shift_list(request):
    shifts = Shift.objects.all()
    return render(request, 'organizations/shift_list.html', {'shifts': shifts})

@login_required
@role_required(['ORG_ADMIN', 'HR_ADMIN'])
def shift_create(request):
    if request.method == 'POST':
        form = ShiftForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "Shift created.")
            return redirect('shift_list')
    else:
        form = ShiftForm()
    return render(request, 'organizations/shift_form.html', {'form': form})

@login_required
@role_required(['ORG_ADMIN', 'HR_ADMIN'])
def shift_edit(request, pk):
    shift = get_object_or_404(Shift, pk=pk)
    if request.method == 'POST':
        form = ShiftForm(request.POST, instance=shift)
        if form.is_valid():
            form.save()
            messages.success(request, "Shift updated.")
            return redirect('shift_list')
    else:
        form = ShiftForm(instance=shift)
    return render(request, 'organizations/shift_form.html', {'form': form})

@login_required
@role_required(['ORG_ADMIN', 'HR_ADMIN'])
def shift_delete(request, pk):
    shift = get_object_or_404(Shift, pk=pk)
    shift.delete()
    messages.success(request, "Shift deleted.")
    return redirect('shift_list')

# --- SETTINGS ---

@login_required
@role_required(['ORG_ADMIN'])
def organization_settings(request):
    org = request.user.organization
    settings, created = OrgSettings.objects.get_or_create(organization=org)
    return render(request, 'organizations/dashboard.html', {'organization': org, 'settings': settings})