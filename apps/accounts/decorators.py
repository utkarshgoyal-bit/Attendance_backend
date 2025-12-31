from functools import wraps
from django.shortcuts import redirect
from django.contrib import messages
from django.core.exceptions import PermissionDenied

def role_required(allowed_roles):
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            from django.db import connection
            
            if not request.user.is_authenticated:
                return redirect('accounts:login')
            
            # Check 1: Primary Role Check
            if request.user.role not in allowed_roles:
                messages.error(request, 'Access Denied: Insufficient Permissions')
                return redirect('dashboard')
            
            # Check 2: Schema/Context Isolation
            # If the view is for SUPER_ADMIN only, it MUST be in the 'public' schema
            if 'SUPER_ADMIN' in allowed_roles and 'ORG_ADMIN' not in allowed_roles:
                if connection.schema_name != 'public':
                    messages.error(request, 'Platform management is only available on the main domain.')
                    return redirect('dashboard')
            
            return view_func(request, *args, **kwargs)
        return _wrapped_view
    return decorator