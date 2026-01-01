import os
from django.conf import settings
from datetime import timezone

class DocumentService:
    @staticmethod
    def upload_employee_document(employee, doc_type, file_obj, user):
        """
        Handles secure, version-controlled document uploads.
        """
        org_id = employee.organization.id
        emp_id = employee.employee_id
        
        # 1. Define Segregated Path: /uploads/org_id/emp_id/category/
        upload_dir = os.path.join('uploads', str(org_id), str(emp_id), doc_type)
        full_path = os.path.join(settings.MEDIA_ROOT, upload_dir)
        os.makedirs(full_path, exist_ok=True)

        # 2. Versioning Logic: If document exists, move old to archive
        existing_doc = employee.documents.filter(document_type=doc_type).first()
        if existing_doc:
            # Move current file info to DocumentVersion table before updating
            existing_doc.archive_current_version(user) # Custom model method

        # 3. Save new file with unique timestamped name
        file_name = f"{doc_type}_{timezone.now().strftime('%Y%m%d%H%M%S')}_{file_obj.name}"
        # save file logic...