from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from apps.accounts.decorators import role_required
from .models import Employee
from .forms import EmployeeForm

@login_required
@role_required(['SUPER_ADMIN', 'ORG_ADMIN', 'HR_ADMIN'])
def employee_create(request):
    if request.method == 'POST':
        # IMPORTANT: Passing request.user to the form for logic filtering
        form = EmployeeForm(request.POST, user=request.user)
        if form.is_valid():
            employee = form.save(commit=False)
            # Add logic here to create the associated User account if needed
            employee.save()
            messages.success(request, f"Employee {employee.first_name} created successfully.")
            return redirect('employee_list')
    else:
        form = EmployeeForm(user=request.user)
    
    return render(request, 'employees/employee_form.html', {'form': form})

@login_required
@role_required(['SUPER_ADMIN', 'ORG_ADMIN', 'HR_ADMIN'])
def employee_list(request):
    if request.user.role == 'SUPER_ADMIN':
        employees = Employee.objects.all()
    else:
        employees = Employee.objects.filter(organization=request.user.organization)
    
    return render(request, 'employees/employee_list.html', {'employees': employees})