import React from 'react';
import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Chip,
    Divider
} from '@heroui/react';
import {
    CheckIcon,
    StarIcon,
    UsersIcon,
    ChartBarIcon,
    ShieldCheckIcon,
    CogIcon,
    ArrowRightIcon,
    PlayIcon
} from '@heroicons/react/24/outline';

export default function Landing({ app_name, app_version }) {
    const features = [
        {
            icon: UsersIcon,
            title: 'HR Management',
            description: 'Complete employee lifecycle management with onboarding, performance tracking, and document management.',
            color: 'primary'
        },
        {
            icon: ChartBarIcon,
            title: 'Analytics & Reporting',
            description: 'Powerful insights and customizable reports to drive data-driven decisions.',
            color: 'secondary'
        },
        {
            icon: ShieldCheckIcon,
            title: 'Quality & Compliance',
            description: 'Ensure quality standards and regulatory compliance with built-in workflows.',
            color: 'success'
        },
        {
            icon: CogIcon,
            title: 'Multi-Module System',
            description: 'Choose only the modules you need and scale as your business grows.',
            color: 'warning'
        }
    ];

    const stats = [
        { number: '10,000+', label: 'Happy Customers' },
        { number: '99.9%', label: 'Uptime' },
        { number: '24/7', label: 'Support' },
        { number: '8+', label: 'Modules Available' }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                duration: 0.5
            }
        }
    };

    return (
        <>
            <Head title={`Welcome to ${app_name}`} />
            
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
                {/* Navigation */}
                <nav className="relative z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-slate-700">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center py-4">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-lg">A</span>
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">{app_name}</h1>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">v{app_version}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center space-x-4">
                                <Button
                                    variant="light"
                                    className="text-gray-600 dark:text-gray-300"
                                >
                                    Login
                                </Button>
                                <Button
                                    color="primary"
                                    variant="solid"
                                    endContent={<ArrowRightIcon className="w-4 h-4" />}
                                    as="a"
                                    href="/register-tenant"
                                >
                                    Start Free Trial
                                </Button>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Hero Section */}
                <section className="relative pt-20 pb-32 overflow-hidden">
                    <motion.div
                        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <div className="text-center">
                            <motion.div variants={itemVariants}>
                                <Chip
                                    color="primary"
                                    variant="flat"
                                    className="mb-8"
                                    startContent={<StarIcon className="w-4 h-4" />}
                                >
                                    Trusted by 10,000+ Companies Worldwide
                                </Chip>
                            </motion.div>

                            <motion.h1 
                                className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6"
                                variants={itemVariants}
                            >
                                Enterprise
                                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    {' '}Management
                                </span>
                                <br />Made Simple
                            </motion.h1>

                            <motion.p 
                                className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-3xl mx-auto"
                                variants={itemVariants}
                            >
                                Streamline your business operations with our comprehensive suite of HR, project management, 
                                quality control, and analytics tools. Pay only for the modules you need.
                            </motion.p>

                            <motion.div 
                                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                                variants={itemVariants}
                            >
                                <Button
                                    size="lg"
                                    color="primary"
                                    variant="solid"
                                    className="min-w-[200px]"
                                    endContent={<ArrowRightIcon className="w-5 h-5" />}
                                    as="a"
                                    href="/register-tenant"
                                >
                                    Start Free Trial
                                </Button>
                                <Button
                                    size="lg"
                                    variant="bordered"
                                    className="min-w-[200px]"
                                    startContent={<PlayIcon className="w-5 h-5" />}
                                >
                                    Watch Demo
                                </Button>
                            </motion.div>

                            <motion.p 
                                className="text-sm text-gray-500 dark:text-gray-400 mt-4"
                                variants={itemVariants}
                            >
                                14-day free trial • No credit card required • Cancel anytime
                            </motion.p>
                        </div>
                    </motion.div>

                    {/* Background decoration */}
                    <div className="absolute inset-0 -z-10">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-20 blur-3xl"></div>
                        <div className="absolute bottom-0 right-0 w-72 h-72 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-20 blur-3xl"></div>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="py-16 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
                    <motion.div 
                        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                    >
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            {stats.map((stat, index) => (
                                <motion.div 
                                    key={index}
                                    className="text-center"
                                    variants={itemVariants}
                                >
                                    <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                                        {stat.number}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-300">
                                        {stat.label}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </section>

                {/* Features Section */}
                <section className="py-24">
                    <motion.div 
                        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                    >
                        <div className="text-center mb-16">
                            <motion.h2 
                                className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4"
                                variants={itemVariants}
                            >
                                Everything You Need to
                                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    {' '}Succeed
                                </span>
                            </motion.h2>
                            <motion.p 
                                className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
                                variants={itemVariants}
                            >
                                Our modular approach lets you start with what you need and grow as your business expands.
                            </motion.p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {features.map((feature, index) => {
                                const IconComponent = feature.icon;
                                return (
                                    <motion.div key={index} variants={itemVariants}>
                                        <Card className="h-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                                            <CardBody className="p-8">
                                                <div className={`w-12 h-12 rounded-lg bg-${feature.color}/10 flex items-center justify-center mb-6`}>
                                                    <IconComponent className={`w-6 h-6 text-${feature.color}`} />
                                                </div>
                                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                                    {feature.title}
                                                </h3>
                                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                                    {feature.description}
                                                </p>
                                            </CardBody>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                </section>

                {/* CTA Section */}
                <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600 relative overflow-hidden">
                    <motion.div 
                        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10"
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                    >
                        <motion.h2 
                            className="text-4xl md:text-5xl font-bold text-white mb-6"
                            variants={itemVariants}
                        >
                            Ready to Transform Your Business?
                        </motion.h2>
                        <motion.p 
                            className="text-xl text-blue-100 mb-10"
                            variants={itemVariants}
                        >
                            Join thousands of companies already using {app_name} to streamline their operations.
                        </motion.p>
                        <motion.div variants={itemVariants}>
                            <Button
                                size="lg"
                                color="default"
                                variant="solid"
                                className="min-w-[250px] text-blue-600 bg-white hover:bg-gray-50"
                                endContent={<ArrowRightIcon className="w-5 h-5" />}
                                as="a"
                                href="/register-tenant"
                            >
                                Start Your Free Trial Today
                            </Button>
                        </motion.div>
                        <motion.p 
                            className="text-blue-100 mt-4 text-sm"
                            variants={itemVariants}
                        >
                            No setup fees • Cancel anytime • 24/7 support included
                        </motion.p>
                    </motion.div>

                    {/* Background decoration */}
                    <div className="absolute inset-0">
                        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3"></div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-gray-900 dark:bg-slate-950 text-white py-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center">
                            <div className="flex items-center justify-center space-x-3 mb-4">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold">A</span>
                                </div>
                                <span className="text-xl font-bold">{app_name}</span>
                            </div>
                            <p className="text-gray-400 mb-4">
                                Enterprise Management Made Simple
                            </p>
                            <p className="text-gray-500 text-sm">
                                © 2025 {app_name}. All rights reserved.
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}