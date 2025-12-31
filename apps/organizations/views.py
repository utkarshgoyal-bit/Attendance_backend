from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from apps.accounts.decorators import role_required
from .models import Organization, Department, Branch, Shift
from .forms import OrganizationForm, DepartmentForm, BranchForm, ShiftForm


@login_required
@role_required(['SUPER_ADMIN'])
def organization_list(request):
    organizations = Organization.objects.all()
    return render(request, 'organizations/organization_list.html', {'organizations': organizations})


@login_required
@role_required(['SUPER_ADMIN'])
def organization_create(request):
    if request.method == 'POST':
        form = OrganizationForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            messages.success(request, 'Organization created successfully')
            return redirect('organizations:organization_list')
    else:
        form = OrganizationForm()
    return render(request, 'organizations/organization_form.html', {'form': form, 'action': 'Create'})


@login_required
@role_required(['SUPER_ADMIN'])
def organization_edit(request, pk):
    organization = get_object_or_404(Organization, pk=pk)
    if request.method == 'POST':
        form = OrganizationForm(request.POST, request.FILES, instance=organization)
        if form.is_valid():
            form.save()
            messages.success(request, 'Organization updated successfully')
            return redirect('organizations:organization_list')
    else:
        form = OrganizationForm(instance=organization)
    return render(request, 'organizations/organization_form.html', {'form': form, 'action': 'Edit'})


@login_required
@role_required(['SUPER_ADMIN'])
def organization_delete(request, pk):
    organization = get_object_or_404(Organization, pk=pk)
    organization.delete()
    messages.success(request, 'Organization deleted successfully')
    return redirect('organizations:organization_list')


@login_required
@role_required(['SUPER_ADMIN', 'ORG_ADMIN'])
def department_list(request):
    if request.user.role == 'SUPER_ADMIN' and connection.schema_name == 'public':
        departments = Department.objects.all()
    else:
        # Explicitly ensure organization exists to prevent global leaks
        if not request.user.organization:
            messages.error(request, "User not linked to an organization.")
            return redirect('dashboard')
        departments = Department.objects.filter(organization=request.user.organization)
    return render(request, 'organizations/department_list.html', {'departments': departments})


@login_required
@role_required(['SUPER_ADMIN', 'ORG_ADMIN'])
def department_create(request):
    if request.method == 'POST':
        form = DepartmentForm(request.POST)
        if form.is_valid():
            department = form.save(commit=False)
            # Always set organization from form or user
            if request.user.role == 'SUPER_ADMIN':
                # SUPER_ADMIN selects organization from form
                pass  # Already set from form
            else:
                # Other roles use their own organization
                department.organization = request.user.organization
            department.save()
            messages.success(request, 'Department created successfully')
            return redirect('organizations:department_list')
    else:
        form = DepartmentForm()
        # Pre-select organization for non-SUPER_ADMIN
        if request.user.role != 'SUPER_ADMIN':
            form.fields['organization'].initial = request.user.organization
            form.fields['organization'].disabled = True
    return render(request, 'organizations/department_form.html', {'form': form, 'action': 'Create'})


@login_required
@role_required(['SUPER_ADMIN', 'ORG_ADMIN'])
def department_edit(request, pk):
    department = get_object_or_404(Department, pk=pk)
    if request.method == 'POST':
        form = DepartmentForm(request.POST, instance=department)
        if form.is_valid():
            form.save()
            messages.success(request, 'Department updated successfully')
            return redirect('organizations:department_list')
    else:
        form = DepartmentForm(instance=department)
    return render(request, 'organizations/department_form.html', {'form': form, 'action': 'Edit'})


@login_required
@role_required(['SUPER_ADMIN', 'ORG_ADMIN'])
def department_delete(request, pk):
    department = get_object_or_404(Department, pk=pk)
    department.delete()
    messages.success(request, 'Department deleted successfully')
    return redirect('organizations:department_list')


@login_required
@role_required(['SUPER_ADMIN', 'ORG_ADMIN'])
def branch_list(request):
    if request.user.role == 'SUPER_ADMIN':
        branches = Branch.objects.all()
    else:
        branches = Branch.objects.filter(organization=request.user.organization)
    return render(request, 'organizations/branch_list.html', {'branches': branches})


@login_required
@role_required(['SUPER_ADMIN', 'ORG_ADMIN'])
def branch_create(request):
    if request.method == 'POST':
        form = BranchForm(request.POST)
        if form.is_valid():
            branch = form.save(commit=False)
            if request.user.role == 'SUPER_ADMIN':
                pass  # Already set from form
            else:
                branch.organization = request.user.organization
            branch.save()
            messages.success(request, 'Branch created successfully')
            return redirect('organizations:branch_list')
    else:
        form = BranchForm()
        if request.user.role != 'SUPER_ADMIN':
            form.fields['organization'].initial = request.user.organization
            form.fields['organization'].disabled = True
    return render(request, 'organizations/branch_form.html', {'form': form, 'action': 'Create'})


@login_required
@role_required(['SUPER_ADMIN', 'ORG_ADMIN'])
def branch_edit(request, pk):
    branch = get_object_or_404(Branch, pk=pk)
    if request.method == 'POST':
        form = BranchForm(request.POST, instance=branch)
        if form.is_valid():
            form.save()
            messages.success(request, 'Branch updated successfully')
            return redirect('organizations:branch_list')
    else:
        form = BranchForm(instance=branch)
    return render(request, 'organizations/branch_form.html', {'form': form, 'action': 'Edit'})


@login_required
@role_required(['SUPER_ADMIN', 'ORG_ADMIN'])
def branch_delete(request, pk):
    branch = get_object_or_404(Branch, pk=pk)
    branch.delete()
    messages.success(request, 'Branch deleted successfully')
    return redirect('organizations:branch_list')


@login_required
@role_required(['SUPER_ADMIN', 'ORG_ADMIN'])
def shift_list(request):
    if request.user.role == 'SUPER_ADMIN':
        shifts = Shift.objects.all()
    else:
        shifts = Shift.objects.filter(organization=request.user.organization)
    return render(request, 'organizations/shift_list.html', {'shifts': shifts})


@login_required
@role_required(['SUPER_ADMIN', 'ORG_ADMIN'])
def shift_create(request):
    if request.method == 'POST':
        form = ShiftForm(request.POST)
        if form.is_valid():
            shift = form.save(commit=False)
            if request.user.role == 'SUPER_ADMIN':
                pass  # Already set from form
            else:
                shift.organization = request.user.organization
            shift.save()
            messages.success(request, 'Shift created successfully')
            return redirect('organizations:shift_list')
    else:
        form = ShiftForm()
        if request.user.role != 'SUPER_ADMIN':
            form.fields['organization'].initial = request.user.organization
            form.fields['organization'].disabled = True
    return render(request, 'organizations/shift_form.html', {'form': form, 'action': 'Create'})


@login_required
@role_required(['SUPER_ADMIN', 'ORG_ADMIN'])
def shift_edit(request, pk):
    shift = get_object_or_404(Shift, pk=pk)
    if request.method == 'POST':
        form = ShiftForm(request.POST, instance=shift)
        if form.is_valid():
            form.save()
            messages.success(request, 'Shift updated successfully')
            return redirect('organizations:shift_list')
    else:
        form = ShiftForm(instance=shift)
    return render(request, 'organizations/shift_form.html', {'form': form, 'action': 'Edit'})


@login_required
@role_required(['SUPER_ADMIN', 'ORG_ADMIN'])
def shift_delete(request, pk):
    shift = get_object_or_404(Shift, pk=pk)
    shift.delete()
    messages.success(request, 'Shift deleted successfully')
    return redirect('organizations:shift_list')
