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
from .task import start_user_activity_monitor
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
        date = request.GET.get('date', None)
        today = datetime.strptime(date, '%Y-%m-%d').date()

        try:
            hubstaff_detail = HustaffDetail.objects.get(user=user, date=today)
        except HustaffDetail.DoesNotExist:
            return Response({'error': 'No activity details found for today.'}, status=status.HTTP_404_NOT_FOUND)

        # Retrieve activity details for today
        activity_details = ActivityDetail.objects.filter(hubstaff_detail=hubstaff_detail)

        start_time = timezone.make_aware(datetime.combine(today, datetime.min.time()))
        end_time = timezone.make_aware(datetime.combine(today, datetime.max.time()))

        intervals = []
        current_start = start_time

        total_worked_duration = timedelta()  # To accumulate total worked time
        total_activity_percentage = 0  # To accumulate activity percentage
        num_intervals = 0  # Number of intervals with activity

        while current_start < end_time:
            current_end = current_start + timedelta(minutes=10)

            # Filter activity details within the current interval
            interval_data = activity_details.filter(start_time__gte=current_start, end_time__lt=current_end)
            
            if interval_data.exists():
                total_mouse_activity_time = interval_data.aggregate(total_mouse_time=Sum(Cast('mouse_activity_time', FloatField())))['total_mouse_time'] or 0
                total_mouse_activity_percentage = interval_data.aggregate(total_mouse_percentage=Avg(Cast(Substr('mouse_activity_percentage', 1, 5), FloatField())))['total_mouse_percentage'] or 0
                total_keyboard_activity_time = interval_data.aggregate(total_keyboard_time=Sum(Cast(Substr('keyboard_activity_time', 1, 5), FloatField())))['total_keyboard_time'] or 0
                total_keyboard_activity_percentage = interval_data.aggregate(total_keyboard_percentage=Avg(Cast(Substr('keyboard_activity_percentage', 1, 5), FloatField())))['total_keyboard_percentage'] or 0
                total_duration = interval_data.aggregate(total_duration=Sum(ExpressionWrapper(F('end_time') - F('start_time'), output_field=DurationField())))['total_duration'] or timedelta()

                # Accumulate worked time and activity percentage
                total_worked_duration += total_duration
                total_activity_percentage += (total_mouse_activity_percentage + total_keyboard_activity_percentage) / 2
                num_intervals += 1

                # Format times for 12-hour clock with AM/PM
                start_time_str = current_start.strftime('%I:%M %p')
                end_time_str = current_end.strftime('%I:%M %p')
                time_interval = f"{start_time_str} - {end_time_str}"

                images = interval_data.values_list('image', flat=True).exclude(image__isnull=True)
                random_image_url = random.choice(images) if images else None

                intervals.append({
                    'id': interval_data[0].id,
                    'time': time_interval,
                    'mouse_activity_time': format_time_in_minutes_or_seconds(total_mouse_activity_time),
                    'mouse_activity_percentage': f"{total_mouse_activity_percentage:.2f}",
                    'keyboard_activity_time': format_time_in_minutes_or_seconds(total_keyboard_activity_time),
                    'keyboard_activity_percentage': f"{total_keyboard_activity_percentage:.2f}",
                    'duration': f"{math.ceil(total_duration.total_seconds() / 60)} minutes",  # Total duration in minutes
                    'percent': f"{round((total_mouse_activity_percentage + total_keyboard_activity_percentage) / 2)}",
                    'image_url': random_image_url if random_image_url else None
                })

            current_start = current_end

        # Calculate total working percentage (average over all intervals)
        total_working_percentage = total_activity_percentage / num_intervals if num_intervals > 0 else 0

        # Prepare the final response with intervals, total worked time, and total working percentage
        response_data = {
            'intervals': intervals,
            'total_worked_time': format_time_in_minutes_or_seconds(total_worked_duration.total_seconds()),  # Total worked time
            'total_working_percentage': f"{total_working_percentage:.2f}"  # Average working percentage
        }

        return Response(response_data, status=status.HTTP_200_OK)

class StopUserActivityView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        user = request.user
        if not user.is_authenticated:
            return JsonResponse({'error': 'User is not authenticated'}, status=403)
        import pdb;pdb.set_trace()
        task_id = request.GET.get('task_id', None)

        result = start_user_activity_monitor.AsyncResult(self, task_id)
        result.abort()
        if result:
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
