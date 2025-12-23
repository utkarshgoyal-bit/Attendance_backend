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
]
