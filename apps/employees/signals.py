from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Employee

User = get_user_model()

@receiver(post_save, sender=Employee)
def create_employee_user(sender, instance, created, **kwargs):
    if created and not hasattr(instance, 'user'):
        # Generate the email and username
        org_domain = instance.organization.name.lower().replace(' ', '')
        email = f"{instance.first_name.lower()}.{instance.last_name.lower()}@{org_domain}.com"
        
        # Create the actual user account
        user = User.objects.create_user(
            username=instance.employee_id,
            email=email,
            password='password123', # Default password for first login
            role='EMPLOYEE',
            organization=instance.organization,
            is_first_login=True
        )
        
        # Link the user back to the employee and save
        instance.user = user
        instance.save()