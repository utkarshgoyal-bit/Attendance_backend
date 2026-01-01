from functools import wraps
from django.shortcuts import redirect
from django.contrib import messages
from django.db import connection

def role_required(allowed_roles):
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return redirect('accounts:login')
            
            # 1. Primary Role Check
            if request.user.role not in allowed_roles:
                messages.error(request, 'Access Denied: Insufficient Permissions')
                return redirect('dashboard')
            
            # 2. Schema/Context Isolation (The "Clean Logic" Guard)
            # Prevent ORG_ADMIN or lower from accessing SUPER_ADMIN views via a tenant URL
            is_public_schema = connection.schema_name == 'public'
            
            if 'SUPER_ADMIN' in allowed_roles and request.user.role != 'SUPER_ADMIN':
                # Blocks non-SuperAdmins from SuperAdmin-only views
                messages.error(request, 'Unauthorized: Platform Management is restricted.')
                return redirect('dashboard')
                
            if request.user.role == 'SUPER_ADMIN' and not is_public_schema:
                # Blocks SuperAdmins from performing platform actions inside a tenant's space
                messages.error(request, 'Platform actions must be performed on the central domain.')
                return redirect('dashboard')
            
            return view_func(request, *args, **kwargs)
        return _wrapped_view
    return decorator