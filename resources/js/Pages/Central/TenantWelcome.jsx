import React from 'react';
import { Head, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Chip,
    Divider,
    Avatar
} from '@heroui/react';
import {
    CheckIcon,
    BuildingOfficeIcon,
    UserIcon,
    CogIcon,
    ArrowRightIcon,
    SparklesIcon,
    ChartBarIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline';

export default function TenantWelcome({ tenant, company, subscription }) {
    const handleGetStarted = () => {
        // Redirect to tenant domain
        window.location.href = `https://${tenant.id}.aero.com/dashboard`;
    };

    const fadeInUp = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <>
            <Head title="Welcome to Aero Enterprise Suite" />
            
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    {/* Success Header */}
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeInUp}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-12"
                    >
                        <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckIcon className="w-10 h-10 text-white" />
                        </div>
                        
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            🎉 Welcome to Aero Enterprise Suite!
                        </h1>
                        
                        <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
                            Your company account has been successfully created
                        </p>
                        
                        <div className="inline-flex items-center space-x-2 text-lg text-green-600 dark:text-green-400">
                            <SparklesIcon className="w-5 h-5" />
                            <span>Setup Complete</span>
                        </div>
                    </motion.div>

                    {/* Company Information Card */}
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeInUp}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="mb-8"
                    >
                        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
                            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
                                <div className="flex items-center space-x-3">
                                    <BuildingOfficeIcon className="w-6 h-6" />
                                    <h2 className="text-xl font-semibold">Company Details</h2>
                                </div>
                            </CardHeader>
                            <CardBody className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                                            Company Information
                                        </h3>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">Company Name:</span>
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {company?.company_name}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">Your Domain:</span>
                                                <span className="font-medium text-blue-600">
                                                    {tenant.id}.aero.com
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">Industry:</span>
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {company?.industry}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">Contact Email:</span>
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {company?.contact_email}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                                            Subscription Details
                                        </h3>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">Plan:</span>
                                                <Chip 
                                                    color="primary" 
                                                    variant="flat"
                                                    size="sm"
                                                >
                                                    {subscription?.plan?.name}
                                                </Chip>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">Billing:</span>
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {subscription?.billing_cycle}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                                                <Chip 
                                                    color="success" 
                                                    variant="flat"
                                                    size="sm"
                                                    startContent={<CheckIcon className="w-3 h-3" />}
                                                >
                                                    {subscription?.status === 'trial' ? 'Free Trial' : subscription?.status}
                                                </Chip>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">Trial Ends:</span>
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {new Date(subscription?.trial_ends_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </motion.div>

                    {/* Selected Modules */}
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeInUp}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="mb-8"
                    >
                        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
                            <CardHeader>
                                <div className="flex items-center space-x-3">
                                    <CogIcon className="w-6 h-6 text-blue-600" />
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                        Your Selected Modules
                                    </h2>
                                </div>
                            </CardHeader>
                            <CardBody className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {subscription?.modules?.map((module) => (
                                        <div 
                                            key={module.id}
                                            className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border border-blue-200 dark:border-blue-800"
                                        >
                                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                                                <CheckIcon className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                                                    {module.name}
                                                </h4>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                                    {module.pivot?.is_included ? 'Included' : `$${module.pivot?.price}`}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardBody>
                        </Card>
                    </motion.div>

                    {/* Next Steps */}
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeInUp}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="mb-8"
                    >
                        <Card className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 border border-green-200 dark:border-green-800">
                            <CardHeader>
                                <div className="flex items-center space-x-3">
                                    <ChartBarIcon className="w-6 h-6 text-green-600" />
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                        What's Next?
                                    </h2>
                                </div>
                            </CardHeader>
                            <CardBody className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="text-center">
                                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center mx-auto mb-3">
                                            <UserIcon className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                            1. Set Up Your Team
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Invite team members and assign roles to get everyone started
                                        </p>
                                    </div>
                                    
                                    <div className="text-center">
                                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center mx-auto mb-3">
                                            <CogIcon className="w-6 h-6 text-purple-600" />
                                        </div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                            2. Configure Modules
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Customize your selected modules to match your workflow
                                        </p>
                                    </div>
                                    
                                    <div className="text-center">
                                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center mx-auto mb-3">
                                            <ChartBarIcon className="w-6 h-6 text-green-600" />
                                        </div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                            3. Start Tracking
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Begin using the system and watch your productivity soar
                                        </p>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </motion.div>

                    {/* Important Information */}
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeInUp}
                        transition={{ duration: 0.6, delay: 0.8 }}
                        className="mb-8"
                    >
                        <Card className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
                            <CardBody className="p-6">
                                <div className="flex items-start space-x-3">
                                    <ShieldCheckIcon className="w-6 h-6 text-yellow-600 mt-1" />
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                            Important Information
                                        </h3>
                                        <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                            <p>
                                                • Your <strong>14-day free trial</strong> has started. No payment required during this period.
                                            </p>
                                            <p>
                                                • Your unique company URL is: <strong className="text-blue-600">{tenant.id}.aero.com</strong>
                                            </p>
                                            <p>
                                                • Admin credentials have been set up for immediate access.
                                            </p>
                                            <p>
                                                • You can modify your subscription and add/remove modules anytime from your dashboard.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </motion.div>

                    {/* Action Buttons */}
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeInUp}
                        transition={{ duration: 0.6, delay: 1.0 }}
                        className="text-center space-y-4"
                    >
                        <Button
                            size="lg"
                            color="primary"
                            className="px-8 py-6 text-lg font-semibold"
                            endContent={<ArrowRightIcon className="w-5 h-5" />}
                            onPress={handleGetStarted}
                        >
                            Access Your Dashboard
                        </Button>
                        
                        <div className="flex justify-center space-x-4">
                            <Button
                                variant="light"
                                size="sm"
                                as="a"
                                href="/help"
                            >
                                Need Help?
                            </Button>
                            <Button
                                variant="light"
                                size="sm"
                                as="a"
                                href="/contact"
                            >
                                Contact Support
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </>
    );
}