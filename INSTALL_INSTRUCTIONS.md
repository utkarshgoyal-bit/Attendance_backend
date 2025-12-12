# MODULE 2 - ORGANIZATIONS INSTALLATION

## PROBLEM
Your Organization model is currently in `apps/accounts/models.py`. 
It should be in `apps/organizations/models.py` for Module 2 to work.

## SOLUTION - Follow these steps EXACTLY:

### Step 1: Backup (Optional but recommended)
```bash
cp db.sqlite3 db.sqlite3.backup
```

### Step 2: Delete Database & Migrations
```bash
del db.sqlite3
rmdir /s /q apps\accounts\migrations
rmdir /s /q apps\organizations\migrations
```

### Step 3: Copy Module 2 Files
Copy all files from this package to your project:
- `apps/organizations/*` → your `apps/organizations/`
- `templates/organizations/*` → your `templates/organizations/`
- `patches/accounts_models.py` → REPLACE your `apps/accounts/models.py`

### Step 4: Update config/settings.py
Add 'apps.organizations' to INSTALLED_APPS (after 'apps.accounts'):
```python
INSTALLED_APPS = [
    ...
    'apps.accounts',
    'apps.organizations',  # ADD THIS
]
```

### Step 5: Update config/urls.py  
Add organizations URLs (after accounts):
```python
urlpatterns = [
    ...
    path('accounts/', include('apps.accounts.urls')),
    path('organizations/', include('apps.organizations.urls')),  # ADD THIS
    path('', dashboard, name='dashboard'),
]
```

### Step 6: Update templates/components/sidebar.html
Replace the Organizations link:
```html
{% if user.role == 'SUPER_ADMIN' %}
<a href="{% url 'organizations:organization_list' %}" class="flex items-center px-4 py-3 hover:bg-gray-700">
```

### Step 7: Create Fresh Migrations
```bash
python manage.py makemigrations accounts
python manage.py makemigrations organizations
python manage.py migrate
```

### Step 8: Create Superuser
```bash
python manage.py createsuperuser
# Email: admin@hrms.com
# Username: admin  
# Password: admin123
```

### Step 9: Run Server
```bash
python manage.py runserver
```

### Step 10: Test
1. Login at http://127.0.0.1:8000/accounts/login/
2. Click "Organizations" in sidebar
3. Click "+ Add Organization"
4. Fill form and save
5. Check it appears in list

## If You Get Errors:
Send me the EXACT error message!
