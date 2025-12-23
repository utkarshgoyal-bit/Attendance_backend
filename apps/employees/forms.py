from django import forms
from .models import Employee
from apps.organizations.models import Organization, Department, Branch, Shift


class EmployeeForm(forms.ModelForm):
    organization = forms.ModelChoiceField(
        queryset=Organization.objects.filter(is_active=True),
        required=True,
        widget=forms.Select(attrs={'class': 'w-full px-4 py-2 border rounded-lg'})
    )

    class Meta:
        model = Employee
        fields = ['organization', 'employee_id', 'first_name', 'last_name', 'date_of_birth', 'gender',
                  'phone', 'department', 'branch', 'shift', 'designation',
                  'date_of_joining', 'employment_status']
        widgets = {
            'employee_id': forms.TextInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg'}),
            'first_name': forms.TextInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg'}),
            'last_name': forms.TextInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg'}),
            'date_of_birth': forms.DateInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg', 'type': 'date'}),
            'gender': forms.Select(attrs={'class': 'w-full px-4 py-2 border rounded-lg'}),
            'phone': forms.TextInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg'}),
            'department': forms.Select(attrs={'class': 'w-full px-4 py-2 border rounded-lg'}),
            'branch': forms.Select(attrs={'class': 'w-full px-4 py-2 border rounded-lg'}),
            'shift': forms.Select(attrs={'class': 'w-full px-4 py-2 border rounded-lg'}),
            'designation': forms.TextInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg'}),
            'date_of_joining': forms.DateInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg', 'type': 'date'}),
            'employment_status': forms.Select(attrs={'class': 'w-full px-4 py-2 border rounded-lg'}),
        }
    
    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        
        # Filter querysets based on organization
        if user and user.role != 'SUPER_ADMIN':
            org = user.organization
            self.fields['organization'].initial = org
            self.fields['organization'].disabled = True
            self.fields['department'].queryset = Department.objects.filter(organization=org, is_active=True)
            self.fields['branch'].queryset = Branch.objects.filter(organization=org, is_active=True)
            self.fields['shift'].queryset = Shift.objects.filter(organization=org, is_active=True)
        elif self.instance.pk:
            # For editing existing employee, filter by their organization
            org = self.instance.organization
            self.fields['department'].queryset = Department.objects.filter(organization=org, is_active=True)
            self.fields['branch'].queryset = Branch.objects.filter(organization=org, is_active=True)
            self.fields['shift'].queryset = Shift.objects.filter(organization=org, is_active=True)
