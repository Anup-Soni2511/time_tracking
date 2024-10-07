import os
from celery import Celery
from django.conf import settings
from django.apps import apps

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hubstaff.settings')

app = Celery('hubstaff')

app.config_from_object('django.conf:settings', namespace='CELERY')

app.autodiscover_tasks()

# app.autodiscover_tasks(lambda: settings.INSTALLED_APPS)

app.autodiscover_tasks(lambda: [n.name for n in apps.get_app_configs()])
