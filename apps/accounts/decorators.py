from functools import wraps
from django.shortcuts import redirect
from django.contrib import messages
from django.core.exceptions import PermissionDenied

def role_required(allowed_roles):
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return redirect('accounts:login')
            
            # 1. Role String Check
            if request.user.role not in allowed_roles:
                messages.error(request, 'Access Denied: Insufficient Permissions')
                return redirect('dashboard')
            
            # 2. Context Isolation Check
            # Prevent ORG_ADMIN from accessing Platform-wide SUPER_ADMIN views
            if 'SUPER_ADMIN' in allowed_roles and request.user.role != 'SUPER_ADMIN':
                raise PermissionDenied("This action requires Platform Super Admin authority.")
            
            return view_func(request, *args, **kwargs)
        return _wrapped_view
    return decorator