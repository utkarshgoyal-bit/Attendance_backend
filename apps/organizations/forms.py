from django import forms
from .models import Organization, Department, Branch, Shift

class OrganizationForm(forms.ModelForm):
    class Meta:
        model = Organization
        fields = ['name', 'schema_name', 'geo_fence_radius', 'require_geo_validation', 'qr_refresh_interval']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg'}),
            'schema_name': forms.TextInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg'}),
            'geo_fence_radius': forms.NumberInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg'}),
            'require_geo_validation': forms.CheckboxInput(attrs={'class': 'rounded text-blue-600 focus:ring-blue-500'}),
            'qr_refresh_interval': forms.NumberInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg'}),
        }

class DepartmentForm(forms.ModelForm):
    organization = forms.ModelChoiceField(
        queryset=Organization.objects.all(),
        required=True,
        widget=forms.Select(attrs={'class': 'w-full px-4 py-2 border rounded-lg'})
    )
    
    class Meta:
        model = Department
        # 'is_active' removed temporarily for migration
        fields = ['organization', 'name', 'code', 'description']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg'}),
            'code': forms.TextInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg'}),
            'description': forms.Textarea(attrs={'class': 'w-full px-4 py-2 border rounded-lg', 'rows': 3}),
        }

class BranchForm(forms.ModelForm):
    organization = forms.ModelChoiceField(
        queryset=Organization.objects.all(),
        required=True,
        widget=forms.Select(attrs={'class': 'w-full px-4 py-2 border rounded-lg'})
    )
    
    class Meta:
        model = Branch
        # 'address', 'city', 'state', 'pincode', 'is_active' removed temporarily
        fields = ['organization', 'name', 'code', 'latitude', 'longitude', 'geo_fence_radius']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg'}),
            'code': forms.TextInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg'}),
            'latitude': forms.NumberInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg', 'step': '0.000001'}),
            'longitude': forms.NumberInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg', 'step': '0.000001'}),
            'geo_fence_radius': forms.NumberInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg'}),
        }

class ShiftForm(forms.ModelForm):
    organization = forms.ModelChoiceField(
        queryset=Organization.objects.all(),
        required=True,
        widget=forms.Select(attrs={'class': 'w-full px-4 py-2 border rounded-lg'})
    )
    
    class Meta:
        model = Shift
        # 'is_active' removed temporarily
        fields = ['organization', 'name', 'code', 'start_time', 'end_time', 'grace_period_minutes']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg'}),
            'code': forms.TextInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg'}),
            'start_time': forms.TimeInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg', 'type': 'time'}),
            'end_time': forms.TimeInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg', 'type': 'time'}),
            'grace_period_minutes': forms.NumberInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg'}),
        }