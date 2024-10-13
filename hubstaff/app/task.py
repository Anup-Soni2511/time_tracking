import pyautogui
from pynput import mouse, keyboard
from threading import Timer
import os
from django.conf import settings
import time
from django.utils import timezone
from .models import ActivityDetail, HustaffDetail
from datetime import datetime
from django.contrib.auth import get_user_model
from celery import shared_task, current_task
from django.core.cache import cache
from celery import current_app
# from celery.contrib.abortable import AbortableTask

import pyautogui
from pynput import mouse, keyboard
from threading import Timer
import os
from django.conf import settings
import time
from django.utils import timezone
from .models import ActivityDetail, HustaffDetail
from datetime import datetime
from django.contrib.auth import get_user_model
from celery import shared_task, current_task
from django.core.cache import cache
from celery import current_app

class UserActivityMonitor:
    def __init__(self, user_id, log_interval=60):
        self.user_id = user_id
        self.log_interval = log_interval
        self.mouse_active_time = 0
        self.keyboard_active_time = 0

        self.start_time = time.time()
        self.last_start_time = self.start_time
        self.mouse_last_active = None
        self.keyboard_last_active = None

        self.mouse_listener = mouse.Listener(on_move=self.on_mouse_activity, on_click=self.on_mouse_activity)
        self.keyboard_listener = keyboard.Listener(on_press=self.on_keyboard_activity)

        # Create or get the HustaffDetail instance for the user
        self.hubstaff_detail, _ = HustaffDetail.objects.get_or_create(user=self.user_id, date=timezone.now().date())

    def on_mouse_activity(self, *args):
        current_time = time.time()
        if self.mouse_last_active is None:
            self.mouse_last_active = current_time
        else:
            self.mouse_active_time += current_time - self.mouse_last_active
            self.mouse_last_active = current_time

    def on_keyboard_activity(self, *args):
        current_time = time.time()
        if self.keyboard_last_active is None:
            self.keyboard_last_active = current_time
        else:
            self.keyboard_active_time += current_time - self.keyboard_last_active
            self.keyboard_last_active = current_time

    def log_activity(self):
        ending_time = time.time()
        total_time = ending_time - self.last_start_time
        mouse_percentage = (self.mouse_active_time / total_time) * 100 if total_time > 0 else 0
        keyboard_percentage = (self.keyboard_active_time / total_time) * 100 if total_time > 0 else 0

        # Prepare the new log entry
        new_log = {
            'start_time': timezone.make_aware(datetime.fromtimestamp(self.last_start_time)).isoformat(),
            'end_time': timezone.make_aware(datetime.fromtimestamp(ending_time)).isoformat(),
            'mouse_activity_time': f"{self.mouse_active_time:.2f}",
            'mouse_activity_percentage': f"{mouse_percentage:.2f}",
            'keyboard_activity_time': f"{self.keyboard_active_time:.2f}",
            'keyboard_activity_percentage': f"{keyboard_percentage:.2f}",
            'total_percentage': f"{(mouse_percentage + keyboard_percentage) / 2:.2f}",
            'screenshot': self.take_screenshot()  # Save screenshot and get file path
        }

        # Get or create the ActivityDetail instance for the day
        activity_detail, created = ActivityDetail.objects.get_or_create(
            hubstaff_detail=self.hubstaff_detail,
            defaults={'activity_data': []}  # Create an empty array for the first log
        )

        # If the record already exists, append the new log to the JSON field
        if not created:
            activity_logs = activity_detail.activity_data  # Get existing logs
        else:
            activity_logs = []

        # Append the new log entry
        activity_logs.append(new_log)


        # Update the activity_data JSON field
        activity_detail.activity_data = activity_logs
        activity_detail.save()

        print(f"Time: {timezone.now()}")
        print(f"Total Time: {total_time:.2f} seconds")
        print(f"Mouse Activity Time: {self.mouse_active_time:.2f} seconds ({mouse_percentage:.2f})")
        print(f"Keyboard Activity Time: {self.keyboard_active_time:.2f} seconds ({keyboard_percentage:.2f})")

        # Reset activity times for the next interval
        self.mouse_active_time = 0
        self.keyboard_active_time = 0
        self.last_start_time = ending_time
        self.mouse_last_active = None
        self.keyboard_last_active = None

        # Schedule the next log and screenshot at a fixed interval
        Timer(self.log_interval, self.log_activity).start()

    def take_screenshot(self):
        # Create a filename based on user email and current time
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{self.user_id.id}_{timestamp}.png"
        # Construct the path to save the file
        file_path = os.path.join(settings.MEDIA_ROOT, filename)
        
        # Take screenshot
        myScreenshot = pyautogui.screenshot()
        myScreenshot.save(file_path)
        print(f"Screenshot saved as {filename} in {settings.MEDIA_ROOT}")
        return filename

    def stop_listeners(self):
        # Stop the listeners safely
        if self.mouse_listener:
            self.mouse_listener.stop()
        if self.keyboard_listener:
            self.keyboard_listener.stop()

    def start(self):
        self.mouse_listener.start()
        self.keyboard_listener.start()
        self.log_activity()


from celery import current_app
import logging
logger = logging.getLogger(__name__)



@shared_task
def stop_user_activity_monitor(user_id):
    User = get_user_model()
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        logger.error(f"User with ID {user_id} does not exist.")
        return

    logger.info(f"Attempting to stop activity monitor for user {user_id}")

    # Logic to stop the task goes here
    # Make sure stop_listeners() works correctly
    monitor = UserActivityMonitor(user_id=user)
    monitor.stop_listeners()

    # Optional: revoke the task
    task_id = cache.get(f"user_activity_task_{user_id}")
    if task_id:
        logger.info(f"Revoking task {task_id} for user {user_id}")
        current_app.control.revoke(task_id, terminate=False)  # Graceful stop
        cache.delete(f"user_activity_task_{user_id}")

    logger.info(f"Activity monitor stopped for user {user_id}")


@shared_task
def start_user_activity_monitor(user_id):
    User = get_user_model()
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        logger.error(f"User with ID {user_id} does not exist.")
        return
    
    monitor = UserActivityMonitor(user_id=user)
    task_id = current_task.request.id
    cache.set(f"user_activity_task_{user_id}", task_id, timeout=None)  # Cache task ID
    logger.info(f"Starting activity monitor for user {user_id}")
    monitor.start()  # Start monitoring

@shared_task
def stop_user_activity_monitor(user_id):
    User = get_user_model()
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        logger.error(f"User with ID {user_id} does not exist.")
        return

    logger.info(f"Attempting to stop activity monitor for user {user_id}")

    # Logic to stop the task goes here
    monitor = UserActivityMonitor(user_id=user)
    monitor.stop_listeners()

    # Revoke the task if necessary
    task_id = cache.get(f"user_activity_task_{user_id}")
    if task_id:
        logger.info(f"Revoking task {task_id} for user {user_id}")
        current_app.control.revoke(task_id, terminate=False)  # Graceful stop
        cache.delete(f"user_activity_task_{user_id}")

    logger.info(f"Activity monitor stopped for user {user_id}")