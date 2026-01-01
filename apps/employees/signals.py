from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Employee

User = get_user_model()

@receiver(post_save, sender=Employee)
def create_employee_user(sender, instance, created, **kwargs):
    # Only run when a NEW employee is created and doesn't have a user yet
    if created and not instance.user:
        # Generate email: firstname.lastname@orgname.com
        org_domain = instance.organization.name.lower().replace(' ', '')
        email = f"{instance.first_name.lower()}.{instance.last_name.lower()}@{org_domain}.com"
        
        # Collision check: If email exists, append employee ID
        if User.objects.filter(email=email).exists():
            email = f"{instance.first_name.lower()}.{instance.last_name.lower()}.{instance.employee_id}@{org_domain}.com"

        # Create the User account
        new_user = User.objects.create_user(
            username=instance.employee_id,
            email=email,
            password='password123',  # Default temp password
            role='EMPLOYEE',
            organization=instance.organization,
            is_first_login=True
        )
        
        # Link and save without re-triggering the signal
        Employee.objects.filter(pk=instance.pk).update(user=new_user)