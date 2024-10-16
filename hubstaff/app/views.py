from datetime import datetime, timedelta
from django.http import JsonResponse
from django.utils import timezone
import random
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from app.serializers import UserRegistrationSerializer, UserLoginSerializer, UserProfileSerializer, UserChangePasswordSerializer, SendResetPasswordEmailSerializer, UserResetPasswordSerializer, ActivityDetailSerializer
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated

from .models import ActivityDetail, HustaffDetail
from django.db.models import Sum, Avg, F, ExpressionWrapper, FloatField, DurationField, CharField
import math
from .task import start_user_activity_monitor, stop_user_activity_monitor
from django.db.models.functions import Cast, Substr 



data = ""
def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)

    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

# Create your views here.
class UserRegistrationView(APIView):
    def post(self, request, format=None):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            user = serializer.save()
            token = get_tokens_for_user(user)
            return Response({'token':token, 'msg': "registration success"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class UserLoginView(APIView):
    def post(self, request, format=None):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            email = serializer.data.get('email')
            password = serializer.data.get('password')
            user = authenticate(email=email, password=password)
            if user is not None:
                token = get_tokens_for_user(user)
                return Response({'token':token, 'msg': 'Login Success'}, status=status.HTTP_200_OK)
            else:
                return Response({'errors':{'non_field_errors':['Email or Password is not valid']}}, status=status.HTTP_404_NOT_FOUND)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    
class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, format=None):
        serializer = UserProfileSerializer(data=request.data)
        return Response(serializer.data, status=status.HTTP_200_OK)

class UserChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, format=None):
        serializer = UserChangePasswordSerializer(data=request.data, context={'user':request.user})
        if serializer.is_valid(raise_exception=True):
            return Response({'msg':'Password Change'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class SendPasswordResetEmailView(APIView):
    def post(self,request, format=None):
        serializer = SendResetPasswordEmailSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            return Response({'msg':'Email Sent'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class UserResetPasswordView(APIView):
    def post(self, request, uid, token, format=None):
        serializer = UserResetPasswordSerializer(data=request.data, context={'uid':uid, 'token':token})
        if serializer.is_valid(raise_exception=True):
            return Response({'msg':'Password Upated Successful'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class UserActivityView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        user = request.user
        if not user.is_authenticated:
            return JsonResponse({'error': 'User is not authenticated'}, status=403)
        
        # Start the activity monitor for the logged-in user 
        # This is a blocking call, which means the server will wait here
        # In a real-world scenario, consider using a background task queue
        result = start_user_activity_monitor.delay(user.id)
        request.session[f"user_activity_task_{user.id}"] = result.id
        
        # Extract task_id instead of returning the full object
        task_id = result.id
        
        return JsonResponse({'status': 'Activity monitor started', "task_id": task_id}, status=200)


    # def get(self, request, format=None):
    #     user = request.user
    #     today = timezone.now().date()
    #     try:
    #         hubstaff_detail = HustaffDetail.objects.get(user=user, date=today)
    #     except HustaffDetail.DoesNotExist:
    #         return Response({'error': 'No activity details found for today.'}, status=status.HTTP_404_NOT_FOUND)

    #     activity_details = ActivityDetail.objects.filter(hubstaff_detail=hubstaff_detail)
    #     serializer = ActivityDetailSerializer(activity_details, many=True)
    #     data = serializer.data
        
    #     return Response(data=data, status=status.HTTP_200_OK)


    def get(self, request, format=None):
        user = request.user
        date_param = request.GET.get('date', None)

        # Parse date (use today's date if date_param is None)
        if date_param is None:
            today = datetime.now().today()
        else:
            try:
                today = datetime.strptime(date_param, '%Y-%m-%d').date()
            except ValueError:
                return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            hubstaff_detail = HustaffDetail.objects.get(user=user, date=today)
        except HustaffDetail.DoesNotExist:
            return Response({'error': 'No activity details found for this date.'}, status=status.HTTP_404_NOT_FOUND)

        # Retrieve activity details for today
        activity_details = ActivityDetail.objects.filter(hubstaff_detail=hubstaff_detail)

        # Define start_time and end_time for the whole day
        start_time = timezone.make_aware(datetime.combine(today, datetime.min.time()))  # 12:00 AM today
        end_time = timezone.make_aware(datetime.combine(today, datetime.max.time()))    # 11:59 PM today

        intervals = []
        current_start = start_time

        total_worked_duration = timedelta()
        total_activity_percentage = 0
        num_intervals = 0

        while current_start < end_time:
            current_end = current_start + timedelta(minutes=10)

            # Filter activity details for this interval
            interval_data = []
            for detail in activity_details:
                for activity in detail.activity_data:
                    start = datetime.fromisoformat(activity['start_time'])
                    end = datetime.fromisoformat(activity['end_time'])

                    # No need to call make_aware(), as `start` and `end` are already timezone-aware
                    if start >= current_start and end < current_end:
                        interval_data.append(activity)

            if interval_data:
                # Aggregation of times and percentages for the interval
                total_mouse_activity_time = sum([float(activity['mouse_activity_time']) for activity in interval_data])
                total_mouse_activity_percentage = sum([float(activity['mouse_activity_percentage']) for activity in interval_data]) / len(interval_data)
                total_keyboard_activity_time = sum([float(activity['keyboard_activity_time']) for activity in interval_data])
                total_keyboard_activity_percentage = sum([float(activity['keyboard_activity_percentage']) for activity in interval_data]) / len(interval_data)

                # Calculate the total duration of activity during this interval
                total_duration = sum([(datetime.fromisoformat(activity['end_time']) - datetime.fromisoformat(activity['start_time'])) for activity in interval_data], timedelta())

                total_worked_duration += total_duration
                total_activity_percentage += (total_mouse_activity_percentage + total_keyboard_activity_percentage) / 2
                num_intervals += 1

                # Format time intervals for display
                start_time_str = current_start.strftime('%I:%M %p')
                end_time_str = current_end.strftime('%I:%M %p')
                time_interval = f"{start_time_str} - {end_time_str}"

                # Select a random image from the interval data if available
                random_image_url = interval_data[-1]['screenshot']

                intervals.append({
                    'time': time_interval,
                    'mouse_activity_time': format_time_in_minutes_or_seconds(total_mouse_activity_time),
                    'mouse_activity_percentage': f"{total_mouse_activity_percentage:.2f}",
                    'keyboard_activity_time': format_time_in_minutes_or_seconds(total_keyboard_activity_time),
                    'keyboard_activity_percentage': f"{total_keyboard_activity_percentage:.2f}",
                    'duration': f"{math.ceil(total_duration.total_seconds() / 60)} minutes",
                    'percent': f"{round((total_mouse_activity_percentage + total_keyboard_activity_percentage) / 2)}",
                    'image_url': random_image_url if random_image_url else None
                })

            current_start = current_end

        # Calculate overall working percentage for the day
        total_working_percentage = total_activity_percentage / num_intervals if num_intervals > 0 else 0

        # Convert total worked duration to string for JSON serialization
        total_worked_time_str = format_time_in_minutes_or_seconds(total_worked_duration.total_seconds())

        response_data = {
            'intervals': intervals,
            'total_worked_time': total_worked_time_str,
            'total_working_percentage': f"{total_working_percentage:.2f}"
        }

        return Response(response_data, status=status.HTTP_200_OK)

class StopUserActivityView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        user = request.user
        if not user.is_authenticated:
            return JsonResponse({'error': 'User is not authenticated'}, status=403)
        task_id = request.session.get(f"user_activity_task_{user.id}", None)

        if task_id:
            result = stop_user_activity_monitor.delay(user.id)
            return Response({"message": "User activity monitor stop request sent."}, status=status.HTTP_200_OK)
        else:
            return Response({"message": "No active task found for this user."}, status=status.HTTP_404_NOT_FOUND)
        
def format_time_in_minutes_or_seconds(time_in_seconds):
    """Converts time to minutes and seconds format if greater than 60 seconds."""
    if time_in_seconds >= 60:
        minutes = time_in_seconds // 60
        seconds = time_in_seconds % 60
        return f"{int(minutes)} minutes {seconds:.2f} seconds"
    else:
        return f"{time_in_seconds:.2f} seconds"
