import json
from django.forms.models import model_to_dict
from .models import AuditLog # Assuming model exists in core or accounts

class AuditService:
    @staticmethod
    def log_action(user, organization, action, entity_type, entity_id, old_values=None, new_values=None, request=None):
        """
        Creates an immutable audit record of a system action.
        """
        ip_address = None
        user_agent = None
        
        if request:
            ip_address = request.META.get('REMOTE_ADDR')
            user_agent = request.META.get('HTTP_USER_AGENT')

        return AuditLog.objects.create(
            organization=organization,
            user=user,
            action=action, # e.g., 'employee.salary_revised'
            entity_type=entity_type,
            entity_id=entity_id,
            old_values=old_values, # JSON snapshot before change
            new_values=new_values, # JSON snapshot after change
            ip_address=ip_address,
            user_agent=user_agent
        )