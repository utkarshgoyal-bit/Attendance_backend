from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Employee

User = get_user_model()

@receiver(post_save, sender=Employee)
def create_employee_user(sender, instance, created, **kwargs):
    if created and not instance.user_id: # Use user_id check to avoid unnecessary queries
        org_domain = instance.organization.name.lower().replace(' ', '')
        email = f"{instance.first_name.lower()}.{instance.last_name.lower()}@{org_domain}.com"
        
        if User.objects.filter(email=email).exists():
            email = f"{instance.first_name.lower()}.{instance.last_name.lower()}.{instance.employee_id}@{org_domain}.com"

        # Create the User account
        new_user = User.objects.create_user(
            username=instance.employee_id,
            email=email,
            password='password123',
            role='EMPLOYEE',
            organization=instance.organization,
            is_first_login=True
        )
        
        # Directly assign and save to ensure the Employee record is updated correctly
        instance.user = new_user
        instance.save(update_fields=['user']) # Only update the user field to prevent infinite loops