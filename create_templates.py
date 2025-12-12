#!/usr/bin/env python3
import os

templates = {
    'templates/organizations/organization_list.html': '''{% extends 'base.html' %}

{% block title %}Organizations{% endblock %}

{% block content %}
<div class="flex justify-between items-center mb-6">
    <h1 class="text-3xl font-bold text-gray-800">Organizations</h1>
    <a href="{% url 'organizations:organization_create' %}" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
        + Add Organization
    </a>
</div>

<div class="bg-white rounded-lg shadow overflow-hidden">
    <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
            <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
            {% for org in organizations %}
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">{{ org.name }}</td>
                <td class="px-6 py-4 whitespace-nowrap">{{ org.city|default:"-" }}</td>
                <td class="px-6 py-4 whitespace-nowrap">{{ org.email|default:"-" }}</td>
                <td class="px-6 py-4 whitespace-nowrap">{{ org.phone|default:"-" }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    {% if org.is_active %}
                    <span class="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Active</span>
                    {% else %}
                    <span class="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Inactive</span>
                    {% endif %}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <a href="{% url 'organizations:organization_edit' org.pk %}" class="text-blue-600 hover:text-blue-800 mr-3">Edit</a>
                    <a href="{% url 'organizations:organization_delete' org.pk %}" class="text-red-600 hover:text-red-800" onclick="return confirm('Are you sure?')">Delete</a>
                </td>
            </tr>
            {% empty %}
            <tr>
                <td colspan="6" class="px-6 py-4 text-center text-gray-500">No organizations found</td>
            </tr>
            {% endfor %}
        </tbody>
    </table>
</div>
{% endblock %}''',

    'templates/organizations/organization_form.html': '''{% extends 'base.html' %}

{% block title %}{{ action }} Organization{% endblock %}

{% block content %}
<div class="max-w-3xl mx-auto">
    <h1 class="text-3xl font-bold text-gray-800 mb-6">{{ action }} Organization</h1>
    
    <div class="bg-white p-6 rounded-lg shadow">
        <form method="post" enctype="multipart/form-data" class="space-y-4">
            {% csrf_token %}
            
            <div class="grid grid-cols-2 gap-4">
                <div class="col-span-2">
                    <label class="block text-sm font-medium mb-1">Organization Name *</label>
                    {{ form.name }}
                    {% if form.name.errors %}
                    <p class="text-red-600 text-sm mt-1">{{ form.name.errors.0 }}</p>
                    {% endif %}
                </div>
                
                <div class="col-span-2">
                    <label class="block text-sm font-medium mb-1">Logo</label>
                    {{ form.logo }}
                </div>
                
                <div class="col-span-2">
                    <label class="block text-sm font-medium mb-1">Address Line 1</label>
                    {{ form.address_line1 }}
                </div>
                
                <div class="col-span-2">
                    <label class="block text-sm font-medium mb-1">Address Line 2</label>
                    {{ form.address_line2 }}
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-1">City</label>
                    {{ form.city }}
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-1">State</label>
                    {{ form.state }}
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-1">Pincode</label>
                    {{ form.pincode }}
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-1">Country</label>
                    {{ form.country }}
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-1">Email</label>
                    {{ form.email }}
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-1">Phone</label>
                    {{ form.phone }}
                </div>
                
                <div class="col-span-2">
                    <label class="block text-sm font-medium mb-1">Website</label>
                    {{ form.website }}
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-1">GST Number</label>
                    {{ form.gst_number }}
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-1">PAN Number</label>
                    {{ form.pan_number }}
                </div>
                
                <div class="col-span-2">
                    <label class="flex items-center">
                        {{ form.is_active }}
                        <span class="ml-2 text-sm">Active</span>
                    </label>
                </div>
            </div>
            
            <div class="flex gap-4">
                <button type="submit" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                    Save
                </button>
                <a href="{% url 'organizations:organization_list' %}" class="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400">
                    Cancel
                </a>
            </div>
        </form>
    </div>
</div>
{% endblock %}''',

    'templates/organizations/department_list.html': '''{% extends 'base.html' %}

{% block title %}Departments{% endblock %}

{% block content %}
<div class="flex justify-between items-center mb-6">
    <h1 class="text-3xl font-bold text-gray-800">Departments</h1>
    <a href="{% url 'organizations:department_create' %}" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
        + Add Department
    </a>
</div>

<div class="bg-white rounded-lg shadow overflow-hidden">
    <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
            <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Organization</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
            {% for dept in departments %}
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">{{ dept.name }}</td>
                <td class="px-6 py-4 whitespace-nowrap">{{ dept.code }}</td>
                <td class="px-6 py-4 whitespace-nowrap">{{ dept.organization.name }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    {% if dept.is_active %}
                    <span class="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Active</span>
                    {% else %}
                    <span class="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Inactive</span>
                    {% endif %}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <a href="{% url 'organizations:department_edit' dept.pk %}" class="text-blue-600 hover:text-blue-800 mr-3">Edit</a>
                    <a href="{% url 'organizations:department_delete' dept.pk %}" class="text-red-600 hover:text-red-800" onclick="return confirm('Are you sure?')">Delete</a>
                </td>
            </tr>
            {% empty %}
            <tr>
                <td colspan="5" class="px-6 py-4 text-center text-gray-500">No departments found</td>
            </tr>
            {% endfor %}
        </tbody>
    </table>
</div>
{% endblock %}''',

    'templates/organizations/department_form.html': '''{% extends 'base.html' %}

{% block title %}{{ action }} Department{% endblock %}

{% block content %}
<div class="max-w-2xl mx-auto">
    <h1 class="text-3xl font-bold text-gray-800 mb-6">{{ action }} Department</h1>
    
    <div class="bg-white p-6 rounded-lg shadow">
        <form method="post" class="space-y-4">
            {% csrf_token %}
            
            <div>
                <label class="block text-sm font-medium mb-1">Organization *</label>
                {{ form.organization }}
                {% if form.organization.errors %}
                <p class="text-red-600 text-sm mt-1">{{ form.organization.errors.0 }}</p>
                {% endif %}
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-1">Department Name *</label>
                {{ form.name }}
                {% if form.name.errors %}
                <p class="text-red-600 text-sm mt-1">{{ form.name.errors.0 }}</p>
                {% endif %}
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-1">Code *</label>
                {{ form.code }}
                {% if form.code.errors %}
                <p class="text-red-600 text-sm mt-1">{{ form.code.errors.0 }}</p>
                {% endif %}
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-1">Description</label>
                {{ form.description }}
            </div>
            
            <div>
                <label class="flex items-center">
                    {{ form.is_active }}
                    <span class="ml-2 text-sm">Active</span>
                </label>
            </div>
            
            <div class="flex gap-4">
                <button type="submit" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                    Save
                </button>
                <a href="{% url 'organizations:department_list' %}" class="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400">
                    Cancel
                </a>
            </div>
        </form>
    </div>
</div>
{% endblock %}'''
}

for filepath, content in templates.items():
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("✓ Created all template files")
