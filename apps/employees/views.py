from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db import IntegrityError
from apps.accounts.decorators import role_required
from apps.accounts.models import User
from .models import Employee
from .forms import EmployeeForm

@login_required
@role_required(['SUPER_ADMIN', 'ORG_ADMIN', 'HR_ADMIN'])
def employee_list(request):
    if request.user.role == 'SUPER_ADMIN':
        employees = Employee.objects.all()
    else:
        employees = Employee.objects.filter(organization=request.user.organization)
    return render(request, 'employees/employee_list.html', {'employees': employees})

@login_required
@role_required(['SUPER_ADMIN', 'ORG_ADMIN', 'HR_ADMIN'])
def employee_create(request):
    if request.method == 'POST':
        form = EmployeeForm(request.POST, user=request.user)
        if form.is_valid():
            employee_id = form.cleaned_data['employee_id']
            if User.objects.filter(username=employee_id).exists():
                messages.error(request, f'Employee ID {employee_id} already exists.')
                return render(request, 'employees/employee_form.html', {'form': form, 'action': 'Create'})
            
            employee = form.save(commit=False)
            if request.user.role != 'SUPER_ADMIN':
                employee.organization = request.user.organization

            try:
                org_domain = employee.organization.name.lower().replace(' ', '')
                email = f"{form.cleaned_data['first_name'].lower()}.{form.cleaned_data['last_name'].lower()}@{org_domain}.com"
                
                if User.objects.filter(email=email).exists():
                    messages.error(request, f'Email {email} already exists.')
                    return render(request, 'employees/employee_form.html', {'form': form, 'action': 'Create'})
                
                user = User.objects.create_user(
                    username=employee_id,
                    email=email,
                    password='password123',
                    role='EMPLOYEE',
                    organization=employee.organization
                )
                employee.user = user
                employee.save()
                messages.success(request, f'Employee created! Login: {email}')
                return redirect('employees:employee_list')
            except IntegrityError as e:
                messages.error(request, f'Error: {str(e)}')
    else:
        form = EmployeeForm(user=request.user)
    return render(request, 'employees/employee_form.html', {'form': form, 'action': 'Create'})

@login_required
@role_required(['SUPER_ADMIN', 'ORG_ADMIN', 'HR_ADMIN'])
def employee_edit(request, pk):
    employee = get_object_or_404(Employee, pk=pk)
    if request.method == 'POST':
        form = EmployeeForm(request.POST, instance=employee, user=request.user)
        if form.is_valid():
            form.save()
            messages.success(request, 'Employee updated successfully')
            return redirect('employees:employee_list')
    else:
        form = EmployeeForm(instance=employee, user=request.user)
    return render(request, 'employees/employee_form.html', {'form': form, 'action': 'Edit'})

@login_required
@role_required(['SUPER_ADMIN', 'ORG_ADMIN', 'HR_ADMIN'])
def employee_delete(request, pk):
    employee = get_object_or_404(Employee, pk=pk)
    employee.delete()
    messages.success(request, 'Employee deleted successfully')
    return redirect('employees:employee_list')