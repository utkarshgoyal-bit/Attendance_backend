# apps/attendance/qr_utils.py
import secrets
import qrcode
from io import BytesIO


def generate_qr_token():
    """
    Generate cryptographically secure random token
    Returns: 32-character URL-safe token
    """
    return secrets.token_urlsafe(32)


def generate_qr_code(url):
    """
    Generate QR code image from URL
    
    Args:
        url (str): The full URL to encode in QR code
    
    Returns:
        BytesIO: QR code image buffer in PNG format
    """
    # Create QR code instance
    qr = qrcode.QRCode(
        version=1,  # Size (1-40, None for auto)
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,  # Pixels per box
        border=4,  # Border thickness
    )
    
    # Add data and generate
    qr.add_data(url)
    qr.make(fit=True)
    
    # Create image
    img = qr.make_image(fill_color='black', back_color='white')
    
    # Save to BytesIO buffer
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    
    return buffer