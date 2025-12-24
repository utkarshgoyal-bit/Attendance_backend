from django import forms
from .models import Organization, Department, Branch, Shift


class OrganizationForm(forms.ModelForm):
    class Meta:
        model = Organization
        fields = ['name', 'logo', 'address_line1', 'address_line2', 'city', 
                  'state', 'pincode', 'country', 'email', 'phone', 'website',
                  'gst_number', 'pan_number', 'qr_refresh_interval', 'is_active']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg'}),
            'address_line1': forms.TextInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg'}),
            'address_line2': forms.TextInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg'}),
            'city': forms.TextInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg'}),
            'state': forms.TextInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg'}),
            'pincode': forms.TextInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg'}),
            'country': forms.TextInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg'}),
            'email': forms.EmailInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg'}),
            'phone': forms.TextInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg'}),
            'website': forms.URLInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg'}),
            'gst_number': forms.TextInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg'}),
            'pan_number': forms.TextInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg'}),
            'qr_refresh_interval': forms.NumberInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg'}),
        }


class DepartmentForm(forms.ModelForm):
    organization = forms.ModelChoiceField(
        queryset=Organization.objects.filter(is_active=True),
        required=True,
        widget=forms.Select(attrs={'class': 'w-full px-4 py-2 border rounded-lg'})
    )
    
    class Meta:
        model = Department
        fields = ['organization', 'name', 'code', 'description', 'is_active']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg'}),
            'code': forms.TextInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg'}),
            'description': forms.Textarea(attrs={'class': 'w-full px-4 py-2 border rounded-lg', 'rows': 3}),
        }


class BranchForm(forms.ModelForm):
    organization = forms.ModelChoiceField(
        queryset=Organization.objects.filter(is_active=True),
        required=True,
        widget=forms.Select(attrs={'class': 'w-full px-4 py-2 border rounded-lg'})
    )
    
    class Meta:
        model = Branch
        fields = ['organization', 'name', 'code', 'address', 'city', 'state', 'pincode', 
                  'latitude', 'longitude', 'geo_fence_radius', 'is_active']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg'}),
            'code': forms.TextInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg'}),
            'address': forms.Textarea(attrs={'class': 'w-full px-4 py-2 border rounded-lg', 'rows': 2}),
            'city': forms.TextInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg'}),
            'state': forms.TextInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg'}),
            'pincode': forms.TextInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg'}),
            'latitude': forms.NumberInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg', 'step': '0.000001'}),
            'longitude': forms.NumberInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg', 'step': '0.000001'}),
            'geo_fence_radius': forms.NumberInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg'}),
        }


class ShiftForm(forms.ModelForm):
    organization = forms.ModelChoiceField(
        queryset=Organization.objects.filter(is_active=True),
        required=True,
        widget=forms.Select(attrs={'class': 'w-full px-4 py-2 border rounded-lg'})
    )
    
    class Meta:
        model = Shift
        fields = ['organization', 'name', 'code', 'start_time', 'end_time', 'grace_period_minutes', 'is_active']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg'}),
            'code': forms.TextInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg'}),
            'start_time': forms.TimeInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg', 'type': 'time'}),
            'end_time': forms.TimeInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg', 'type': 'time'}),
            'grace_period_minutes': forms.NumberInput(attrs={'class': 'w-full px-4 py-2 border rounded-lg'}),
        }