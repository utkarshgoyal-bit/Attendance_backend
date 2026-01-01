from django import forms
from .models import Employee
from apps.organizations.models import Organization, Department, Branch, Shift

class EmployeeForm(forms.ModelForm):
    organization = forms.ModelChoiceField(
        queryset=Organization.objects.all(),
        required=True,
        widget=forms.Select(attrs={'class': 'w-full px-4 py-2 border rounded-lg'})
    )
    
    class Meta:
        model = Employee
        fields = ['organization', 'employee_id', 'designation', 'date_of_joining'] 
    # Temporarily hide: 'first_name', 'last_name', 'phone', etc.
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
        
        if user:
            if user.role == 'SUPER_ADMIN':
                if self.data.get('organization'):
                    org_id = self.data.get('organization')
                    self.fields['department'].queryset = Department.objects.filter(organization_id=org_id, is_active=True)
                    self.fields['branch'].queryset = Branch.objects.filter(organization_id=org_id, is_active=True)
                    self.fields['shift'].queryset = Shift.objects.filter(organization_id=org_id, is_active=True)
                elif self.instance.pk:
                    org = self.instance.organization
                    self.fields['department'].queryset = Department.objects.filter(organization=org, is_active=True)
                    self.fields['branch'].queryset = Branch.objects.filter(organization=org, is_active=True)
                    self.fields['shift'].queryset = Shift.objects.filter(organization=org, is_active=True)
                else:
                    self.fields['department'].queryset = Department.objects.none()
                    self.fields['branch'].queryset = Branch.objects.none()
                    self.fields['shift'].queryset = Shift.objects.none()
            else:
                org = user.organization
                self.fields['organization'].initial = org
                self.fields['organization'].disabled = True
                self.fields['department'].queryset = Department.objects.filter(organization=org, is_active=True)
                self.fields['branch'].queryset = Branch.objects.filter(organization=org, is_active=True)
                self.fields['shift'].queryset = Shift.objects.filter(organization=org, is_active=True)