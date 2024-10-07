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
from celery.contrib.abortable import AbortableTask

class UserActivityMonitor:
    def __init__(self, user_id, log_interval=60):
        self.user_id = user_id
        self.log_interval = log_interval
        self.mouse_active_time = 0
        self.keyboard_active_time = 0
        self.stop_requested = False  # Flag to stop monitoring

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
        # Check if stop was requested
        if self.stop_requested:
            print(f"Stopping activity monitoring for user {self.user_id}")
            self.stop_listeners()
            return

        ending_time = time.time()
        total_time = ending_time - self.last_start_time
        mouse_percentage = (self.mouse_active_time / total_time) * 100 if total_time > 0 else 0
        keyboard_percentage = (self.keyboard_active_time / total_time) * 100 if total_time > 0 else 0

        # Create ActivityDetail instance and save to the database
        ActivityDetail.objects.create(
            hubstaff_detail=self.hubstaff_detail,
            start_time=timezone.make_aware(datetime.fromtimestamp(self.last_start_time)),
            end_time=timezone.make_aware(datetime.fromtimestamp(ending_time)),
            mouse_activity_time=f"{self.mouse_active_time:.2f}",
            mouse_activity_percentage=f"{mouse_percentage:.2f}",
            keyboard_activity_time=f"{self.keyboard_active_time:.2f}",
            keyboard_activity_percentage=f"{keyboard_percentage:.2f}",
            image=self.take_screenshot(),  # Save screenshot and get file path
            total_percentage=f"{(mouse_percentage + keyboard_percentage)/2:.2f}"  # Example of total percentage
        )

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

        while not self.stop_requested:
            if self.is_aborted():
                return "Task Stopppped!!"
            time.sleep(1)

            # Periodically check the stop flag from the cache (set by the stop task)
            if cache.get(f"stop_flag_{self.user_id.id}"):
                self.stop_requested = True

        # Stop logging and cleanup once the stop flag is set
        self.log_activity()
    

# @shared_task
# def start_user_activity_monitor(user_id):
#     User = get_user_model()
#     user = User.objects.get(id=user_id)
    
#     monitor = UserActivityMonitor(user_id=user)
#     task_id = current_task.request.id
#     cache.set(f"user_activity_task_{user_id}", task_id, timeout=None)  # Cache task ID
#     print(f"Starting activity monitor for user {user_id}")
#     monitor.start()  # Start monitoring

@shared_task(bind=True, base=AbortableTask)
def start_user_activity_monitor(self, user_id):
    User = get_user_model()
    user = User.objects.get(id=user_id)
    
    monitor = UserActivityMonitor(user_id=user)
    task_id = self.request.id
    cache.set(f"user_activity_task_{user_id}", task_id, timeout=None)
    print(f"Starting activity monitor for user {user_id}")
    monitor.start()


# @shared_task
# def stop_user_activity_monitor(user_id):
#     task_id = cache.get(f"user_activity_task_{user_id}")
#     if task_id:
#         print(f"Requesting stop for task {task_id} of user {user_id}")
        
#         # Set the stop flag in Redis
#         cache.set(f"stop_flag_{user_id}", True)

#         # Optionally revoke the task (terminate=False for graceful exit)
#         current_app.control.revoke(task_id, terminate=False)
        
#         # Clean up the cached task ID
#         cache.delete(f"user_activity_task_{user_id}")
        
#         return True
#     print(f"No task ID found in cache for user {user_id}")
#     return False
