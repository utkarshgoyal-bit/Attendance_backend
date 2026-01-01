from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Organization, OrgSettings

@receiver(post_save, sender=Organization)
def create_org_settings(sender, instance, created, **kwargs):
    if created:
        OrgSettings.objects.get_or_create(organization=instance)
        