from django.contrib import admin
from django.urls import path, include
from app.views import UserRegistrationView, UserLoginView, UserProfileView, UserChangePasswordView, SendPasswordResetEmailView, UserResetPasswordView, UserActivityView, StopUserActivityView

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('login/', UserLoginView.as_view(), name='login'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('changepassword/', UserChangePasswordView.as_view(), name='changepassword'),
    path('send-reset-password-email/', SendPasswordResetEmailView.as_view(), name='send-reset-password-email'),
    path('reset-password/<uid>/<token>', UserResetPasswordView.as_view(), name='reset-password'),
    path('activity-details/', UserActivityView.as_view(), name='activity-detail-create'),
    path('activity-details-stop/', StopUserActivityView.as_view(), name='stop-activity-detail-create'),


]