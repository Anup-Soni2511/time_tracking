import re
from rest_framework import serializers
from app.models import User, ActivityDetail
from django.utils.encoding import smart_str, force_bytes, DjangoUnicodeDecodeError
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from drf_extra_fields.fields import Base64ImageField
import base64
from io import BytesIO
from django.core.files.base import ContentFile
import os

class UserRegistrationSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(style={'input_type':'password'}, write_only=True)
    class Meta:
        model = User
        fields = ['email', 'name', 'password', 'password2', 'tc']
        extra_kwargs = {
            'password':{'write_only':True}
        }

    def validate_password(self, value):
        if not re.search(r'[a-z]', value):
            raise serializers.ValidationError('Password must contain at least one lowercase letter.')
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError('Password must contain at least one uppercase letter.')
        if not re.search(r'\d', value):
            raise serializers.ValidationError('Password must contain at least one digit.')
        if not re.search(r'[@.#$!%*?&^]', value):
            raise serializers.ValidationError('Password must contain at least one special character: @ . # $ ! % * ? & ^')
        if len(value) < 8 or len(value) > 15:
            raise serializers.ValidationError('Password must be between 8 and 15 characters long.')

        return value
    
    def validate(self, attrs):
        password = attrs.get('password')
        password2 = attrs.get('password2')
        if password != password2:
            raise serializers.ValidationError("password and confirm password doesn't match")
        return attrs

    def create(self, validate_data):
        return User.objects.create_user(**validate_data)
    
class UserLoginSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(max_length=255)
    class Meta:
        model = User
        fields = ['email', 'password']

    def validate_password(self, value):
        if not re.search(r'[a-z]', value):
            raise serializers.ValidationError('Password must contain at least one lowercase letter.')
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError('Password must contain at least one uppercase letter.')
        if not re.search(r'\d', value):
            raise serializers.ValidationError('Password must contain at least one digit.')
        if not re.search(r'[@.#$!%*?&^]', value):
            raise serializers.ValidationError('Password must contain at least one special character: @ . # $ ! % * ? & ^')
        if len(value) < 8 or len(value) > 15:
            raise serializers.ValidationError('Password must be between 8 and 15 characters long.')

        return value

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')
        return data

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'name']

class UserChangePasswordSerializer(serializers.Serializer):
    password = serializers.CharField(max_length=255, style={'input_type':'password'}, write_only=True)
    password2 = serializers.CharField(max_length=255, style={'input_type':'password'}, write_only=True)
    class Meta:
        fields = ['password', 'password2']

    def validate(self, attrs):
        password = attrs.get('password')
        password2 = attrs.get('password2')
        user = self.context.get('user')
        if password != password2:
            raise serializers.ValidationError("password and confirm password doesn't match")
        user.set_password(password)
        user.save()
        return attrs

class SendResetPasswordEmailSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=255)
    class Meta:
        fields = ['email']
    
    def validate(self, attrs):
        email = attrs.get('email')
        if not User.objects.filter(email=email).exists():
            raise serializers.ValidationError('User with this email does not exist.')
        user = User.objects.get(email=email)
        uid = urlsafe_base64_encode(force_bytes(user.id))
        print("uid : "+ uid)
        token = PasswordResetTokenGenerator().make_token(user)
        print("token : "+token)
        link = "http://localhost:5173/update-password/"+uid+"/"+token
        print("link : "+link)
        body = "Click Following Link to Reset Your Password " + link
        data = {
            "subject": "Reset Your Password",
            "body": body,
            "to_email": user.email
        }
        send_mails(data)
        return attrs

class UserResetPasswordSerializer(serializers.Serializer):
    password = serializers.CharField(max_length=255, style={'input_type':'password'}, write_only=True)
    password2 = serializers.CharField(max_length=255, style={'input_type':'password'}, write_only=True)
    class Meta:
        fields = ['password', 'password2']

    def validate(self, attrs):
        try:
            password = attrs.get('password')
            password2 = attrs.get('password2')
            uid = self.context.get('uid')
            token = self.context.get('token')
            user = self.context.get('user')
            if password != password2:
                raise serializers.ValidationError("password and confirm password doesn't match")
            id = smart_str(urlsafe_base64_decode(uid))
            user = User.objects.get(id=id)
            if not PasswordResetTokenGenerator().check_token(user, token):
                raise ValidationError("Token is not valid or expire")
            user.set_password(password)
            user.save()
            return attrs
        except  DjangoUnicodeDecodeError as identifier:
            PasswordResetTokenGenerator().check_token(user, token)
            raise ValidationError("Token is not valid or expire")

def send_mails(data):
    send_mail(data['subject'],data['body'],"anupsoni2523@gmail.com",[data['to_email']])
        
class ActivityDetailSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(use_url=True)

    class Meta:
        model = ActivityDetail
        fields = ['start_time', 'end_time', 'mouse_activity_time', 'mouse_activity_percentage',
                  'keyboard_activity_time', 'keyboard_activity_percentage', 'image', 'total_percentage']

    def create(self, validated_data):
        hubstaff_detail = self.context.get('hubstaff_detail')
        if not hubstaff_detail:
            raise serializers.ValidationError("Hubstaff detail is required.")
        
        validated_data['hubstaff_detail'] = hubstaff_detail
        return super().create(validated_data)