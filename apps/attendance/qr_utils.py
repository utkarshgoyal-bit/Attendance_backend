import qrcode
from io import BytesIO
from django.core.files.base import ContentFile
import secrets


def generate_qr_token():
    """Generate unique token for QR code"""
    return secrets.token_urlsafe(32)


def generate_qr_code(token):
    """Generate QR code image"""
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(token)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color='black', back_color='white')
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    
    return ContentFile(buffer.read(), name=f'qr_{token[:8]}.png')