# apps/attendance/qr_utils.py
import secrets
import qrcode
from io import BytesIO


def generate_qr_token():
    """Generate cryptographically secure random token"""
    return secrets.token_urlsafe(32)


def generate_qr_code(url):
    """
    Generate QR code image from URL
    
    Args:
        url: The full URL to encode in QR code
    
    Returns:
        BytesIO: QR code image buffer
    """
    # Generate QR
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)
    
    # Create image
    img = qr.make_image(fill_color='black', back_color='white')
    
    # Save to BytesIO
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    
    return buffer