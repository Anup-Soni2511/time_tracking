from django.contrib import admin
from app.models import User, HustaffDetail, ActivityDetail
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

# Register your models here.

class UserModelAdmin(BaseUserAdmin):

    # The fields to be used in displaying the User model.
    # These override the definitions on the base UserAdmin
    # that reference specific fields on auth.User.
    list_display = ["id", "email", "name", "user_activity_task_id", "tc", "is_admin"]
    list_filter = ["is_admin"]
    fieldsets = [
        (None, {"fields": ["email", "password"]}),
        ("Personal info", {"fields": ["name", "tc"]}),
        ("Permissions", {"fields": ["is_admin"]}),
    ]
    # add_fieldsets is not a standard ModelAdmin attribute. UserAdmin
    # overrides get_fieldsets to use this attribute when creating a user.
    add_fieldsets = [
        (
            None,
            {
                "classes": ["wide"],
                "fields": ["email", "name", "tc", "password1", "password2"],
            },
        ),
    ]
    search_fields = ["email"]
    ordering = ["email", "id"]
    filter_horizontal = []

class ActivityDetailInline(admin.TabularInline):  # or admin.StackedInline for a different layout
    model = ActivityDetail
    extra = 1
    fields = (
        'activity_data',
    )

class HustaffDetailAdmin(admin.ModelAdmin):
    inlines = [ActivityDetailInline]

    list_display = ('user', 'date',)
    list_filter = ('user', 'date',)
    search_fields = ('user', 'date')

admin.site.register(User, UserModelAdmin)
admin.site.register(HustaffDetail, HustaffDetailAdmin)
