from django.urls import path
from . import views

app_name = 'attendance'

urlpatterns = [
    path('', views.attendance_dashboard, name='dashboard'),
    path('checkin/', views.checkin, name='checkin'),
    path('checkout/', views.checkout, name='checkout'),
    path('history/', views.attendance_history, name='history'),
    path('list/', views.attendance_list, name='list'),
    path('<int:pk>/regularize/', views.request_regularization, name='request_regularization'),
    path('pending/', views.pending_regularizations, name='pending_regularizations'),
    path('<int:pk>/approve/', views.approve_regularization, name='approve_regularization'),
    path('<int:pk>/reject/', views.reject_regularization, name='reject_regularization'),
    path('qr/generate/', views.generate_qr_view, name='generate_qr'),
    path('qr/scan/', views.qr_checkin, name='qr_checkin'),
    path('qr/generate/', views.generate_qr_view, name='generate_qr'),
    path('qr/display/<int:branch_id>/', views.qr_display, name='qr_display'),
    path('qr/scan/', views.qr_checkin, name='qr_checkin'),
    path('checkin/pending/', views.pending_checkin_approvals, name='pending_checkin_approvals'),
    path('checkin/<int:pk>/approve/', views.approve_checkin, name='approve_checkin'),
    path('checkin/<int:pk>/reject/', views.reject_checkin, name='reject_checkin'),
]