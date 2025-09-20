import React from 'react';
import {
    CurrencyDollarIcon,
    CogIcon,
    UsersIcon,
    ChartBarIcon,
    BuildingOfficeIcon,
    ShieldCheckIcon,
    ServerIcon,
    DocumentChartBarIcon,
    WrenchScrewdriverIcon,
    Squares2X2Icon,
    BanknotesIcon,
    ClipboardDocumentListIcon,
    UserGroupIcon,
    CloudIcon,
    ExclamationTriangleIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';

// Function to create admin pages array for central application management
export const getAdminPages = (permissions = []) => {
    const adminPages = [];

    // 1. Dashboard
    if (permissions.includes('admin.dashboard.view')) {
        adminPages.push({
            name: 'Admin Dashboard',
            icon: <Squares2X2Icon className="" />,
            route: 'admin.dashboard',
            priority: 1,
            module: 'admin-core'
        });
    }

    // 2. Subscription Management
    if (permissions.includes('admin.subscriptions.view')) {
        adminPages.push({
            name: 'Subscription Management',
            icon: <CurrencyDollarIcon className="" />,
            priority: 2,
            module: 'subscriptions',
            subMenu: [
                ...(permissions.includes('admin.subscription-plans.view') ? [
                    { name: 'Subscription Plans', icon: <BanknotesIcon />, route: 'admin.subscription.management' }
                ] : []),
                ...(permissions.includes('admin.modules.view') ? [
                    { name: 'Feature Modules', icon: <CogIcon />, route: 'admin.subscription.management' }
                ] : []),
                ...(permissions.includes('admin.billing.view') ? [
                    { name: 'Billing & Payments', icon: <ClipboardDocumentListIcon />, route: 'admin.billing.dashboard' }
                ] : []),
                ...(permissions.includes('admin.revenue.view') ? [
                    { name: 'Revenue Analytics', icon: <ChartBarIcon />, route: 'admin.revenue.analytics' }
                ] : [])
            ]
        });
    }

    // 3. Tenant Management
    if (permissions.includes('admin.tenants.view')) {
        adminPages.push({
            name: 'Tenant Management',
            icon: <BuildingOfficeIcon className="" />,
            priority: 3,
            module: 'tenants',
            subMenu: [
                ...(permissions.includes('admin.tenants.list') ? [
                    { name: 'All Tenants', icon: <UserGroupIcon />, route: 'admin.tenants' }
                ] : []),
                ...(permissions.includes('admin.tenants.create') ? [
                    { name: 'Create Tenant', icon: <UsersIcon />, route: 'admin.tenants.create' }
                ] : []),
                ...(permissions.includes('admin.tenant-analytics.view') ? [
                    { name: 'Usage Analytics', icon: <DocumentChartBarIcon />, route: 'admin.tenant.analytics' }
                ] : []),
                ...(permissions.includes('admin.tenant-health.view') ? [
                    { name: 'Health Monitoring', icon: <ExclamationTriangleIcon />, route: 'admin.tenant.health' }
                ] : [])
            ]
        });
    }

    // 4. System Administration
    if (permissions.includes('admin.system.view')) {
        adminPages.push({
            name: 'System Administration',
            icon: <ServerIcon className="" />,
            priority: 4,
            module: 'system',
            subMenu: [
                ...(permissions.includes('admin.system.health') ? [
                    { name: 'System Health', icon: <ExclamationTriangleIcon />, route: 'admin.system.health' }
                ] : []),
                ...(permissions.includes('admin.system.configuration') ? [
                    { name: 'Configuration', icon: <WrenchScrewdriverIcon />, route: 'admin.system.config' }
                ] : []),
                ...(permissions.includes('admin.system.updates') ? [
                    { name: 'System Updates', icon: <ArrowPathIcon />, route: 'admin.system.updates' }
                ] : []),
                ...(permissions.includes('admin.system.backups') ? [
                    { name: 'Backups', icon: <CloudIcon />, route: 'admin.system.backups' }
                ] : [])
            ]
        });
    }

    // 5. Security & Access
    if (permissions.includes('admin.security.view')) {
        adminPages.push({
            name: 'Security & Access',
            icon: <ShieldCheckIcon className="" />,
            priority: 5,
            module: 'security',
            subMenu: [
                ...(permissions.includes('admin.users.view') ? [
                    { name: 'Admin Users', icon: <UserGroupIcon />, route: 'admin.users' }
                ] : []),
                ...(permissions.includes('admin.roles.view') ? [
                    { name: 'Roles & Permissions', icon: <ShieldCheckIcon />, route: 'admin.roles' }
                ] : []),
                ...(permissions.includes('admin.audit.view') ? [
                    { name: 'Audit Logs', icon: <DocumentChartBarIcon />, route: 'admin.audit.logs' }
                ] : []),
                ...(permissions.includes('admin.security.settings') ? [
                    { name: 'Security Settings', icon: <WrenchScrewdriverIcon />, route: 'admin.security.settings' }
                ] : [])
            ]
        });
    }

    // 6. Analytics & Reporting
    if (permissions.includes('admin.analytics.view')) {
        adminPages.push({
            name: 'Analytics & Reporting',
            icon: <ChartBarIcon className="" />,
            priority: 6,
            module: 'analytics',
            subMenu: [
                ...(permissions.includes('admin.analytics.revenue') ? [
                    { name: 'Revenue Reports', icon: <BanknotesIcon />, route: 'admin.analytics.revenue' }
                ] : []),
                ...(permissions.includes('admin.analytics.usage') ? [
                    { name: 'Usage Statistics', icon: <DocumentChartBarIcon />, route: 'admin.analytics.usage' }
                ] : []),
                ...(permissions.includes('admin.analytics.performance') ? [
                    { name: 'Performance Metrics', icon: <ChartBarIcon />, route: 'admin.analytics.performance' }
                ] : []),
                ...(permissions.includes('admin.analytics.custom') ? [
                    { name: 'Custom Reports', icon: <ClipboardDocumentListIcon />, route: 'admin.analytics.custom' }
                ] : [])
            ]
        });
    }

    return adminPages;
};

// Function to create admin settings pages
export const getAdminSettingsPages = (permissions = []) => {
    const settings = [];

    // 1. Navigation
    if (permissions.includes('admin.dashboard.view')) {
        settings.push({
            name: 'Return to Admin Dashboard',
            icon: <Squares2X2Icon className="w-5 h-5" />,
            route: 'admin.dashboard',
            category: 'navigation',
            priority: 1
        });
    }

    // 2. Platform Configuration
    if (permissions.includes('admin.platform.settings')) {
        settings.push({
            name: 'Platform Configuration',
            icon: <WrenchScrewdriverIcon className="w-5 h-5" />,
            route: 'admin.settings.platform',
            category: 'platform',
            priority: 2,
            description: 'Configure platform-wide settings and branding'
        });
    }

    if (permissions.includes('admin.subscription.settings')) {
        settings.push({
            name: 'Subscription Settings',
            icon: <CurrencyDollarIcon className="w-5 h-5" />,
            route: 'admin.settings.subscriptions',
            category: 'platform',
            priority: 3,
            description: 'Configure subscription plans, billing cycles, and payment settings'
        });
    }

    if (permissions.includes('admin.tenant.settings')) {
        settings.push({
            name: 'Tenant Configuration',
            icon: <BuildingOfficeIcon className="w-5 h-5" />,
            route: 'admin.settings.tenants',
            category: 'platform',
            priority: 4,
            description: 'Configure tenant creation, limits, and default settings'
        });
    }

    // 3. Security Configuration
    if (permissions.includes('admin.security.settings')) {
        settings.push({
            name: 'Security Settings',
            icon: <ShieldCheckIcon className="w-5 h-5" />,
            route: 'admin.settings.security',
            category: 'security',
            priority: 5,
            description: 'Configure security policies, authentication, and access controls'
        });
    }

    if (permissions.includes('admin.backup.settings')) {
        settings.push({
            name: 'Backup & Recovery',
            icon: <CloudIcon className="w-5 h-5" />,
            route: 'admin.settings.backup',
            category: 'security',
            priority: 6,
            description: 'Configure automated backups and disaster recovery'
        });
    }

    // 4. Integration Settings
    if (permissions.includes('admin.integrations.settings')) {
        settings.push({
            name: 'Third-party Integrations',
            icon: <CogIcon className="w-5 h-5" />,
            route: 'admin.settings.integrations',
            category: 'integrations',
            priority: 7,
            description: 'Configure payment gateways, email services, and other integrations'
        });
    }

    if (permissions.includes('admin.notifications.settings')) {
        settings.push({
            name: 'Notification Settings',
            icon: <DocumentChartBarIcon className="w-5 h-5" />,
            route: 'admin.settings.notifications',
            category: 'integrations',
            priority: 8,
            description: 'Configure system notifications and communication templates'
        });
    }

    // 5. Monitoring & Maintenance
    if (permissions.includes('admin.monitoring.settings')) {
        settings.push({
            name: 'Monitoring & Alerts',
            icon: <ExclamationTriangleIcon className="w-5 h-5" />,
            route: 'admin.settings.monitoring',
            category: 'maintenance',
            priority: 9,
            description: 'Configure system monitoring, alerts, and performance thresholds'
        });
    }

    if (permissions.includes('admin.maintenance.settings')) {
        settings.push({
            name: 'Maintenance Mode',
            icon: <WrenchScrewdriverIcon className="w-5 h-5" />,
            route: 'admin.settings.maintenance',
            category: 'maintenance',
            priority: 10,
            description: 'Configure scheduled maintenance and system updates'
        });
    }

    return settings;
};

// Default admin permissions for super admin users
export const getDefaultAdminPermissions = () => [
    'admin.dashboard.view',
    'admin.subscriptions.view',
    'admin.subscription-plans.view',
    'admin.modules.view',
    'admin.billing.view',
    'admin.revenue.view',
    'admin.tenants.view',
    'admin.tenants.list',
    'admin.tenants.create',
    'admin.tenant-analytics.view',
    'admin.tenant-health.view',
    'admin.system.view',
    'admin.system.health',
    'admin.system.configuration',
    'admin.system.updates',
    'admin.system.backups',
    'admin.security.view',
    'admin.users.view',
    'admin.roles.view',
    'admin.audit.view',
    'admin.security.settings',
    'admin.analytics.view',
    'admin.analytics.revenue',
    'admin.analytics.usage',
    'admin.analytics.performance',
    'admin.analytics.custom',
    'admin.platform.settings',
    'admin.subscription.settings',
    'admin.tenant.settings',
    'admin.backup.settings',
    'admin.integrations.settings',
    'admin.notifications.settings',
    'admin.monitoring.settings',
    'admin.maintenance.settings'
];