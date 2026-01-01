from django.contrib import admin
from .models import Attendance, QRToken

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('employee', 'date', 'check_in_time', 'check_out_time', 'status', 'working_hours')
    list_filter = ('status', 'date', 'check_in_method')