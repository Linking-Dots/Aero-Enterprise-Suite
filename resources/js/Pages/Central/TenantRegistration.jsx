import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Input,
    Select,
    SelectItem,
    Chip,
    Divider,
    Progress,
    Checkbox,
    Textarea,
    Avatar
} from '@heroui/react';
import {
    ArrowLeftIcon,
    ArrowRightIcon,
    CheckIcon,
    CreditCardIcon,
    UserIcon,
    BuildingOfficeIcon,
    CogIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';

export default function TenantRegistration({ subscriptionPlans = [], modules = [] }) {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        // Company Information
        companyName: '',
        companySlug: '',
        contactEmail: '',
        contactPhone: '',
        industry: '',
        companySize: '',
        website: '',
        description: '',
        
        // Plan Selection
        selectedPlan: null,
        selectedModules: [],
        billingCycle: 'monthly',
        
        // Account Setup
        adminName: '',
        adminEmail: '',
        password: '',
        passwordConfirmation: '',
        
        // Preferences
        timezone: 'UTC',
        agreeToTerms: false
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const steps = [
        { id: 1, title: 'Company Info', icon: BuildingOfficeIcon, description: 'Tell us about your company' },
        { id: 2, title: 'Select Plan', icon: CogIcon, description: 'Choose your modules and plan' },
        { id: 3, title: 'Admin Account', icon: UserIcon, description: 'Create your admin account' },
        { id: 4, title: 'Finalize', icon: SparklesIcon, description: 'Review and complete setup' }
    ];

    const industries = [
        'Technology', 'Healthcare', 'Manufacturing', 'Education', 'Finance',
        'Retail', 'Construction', 'Transportation', 'Food & Beverage', 'Other'
    ];

    const companySizes = [
        { value: '1-10', label: '1-10 employees' },
        { value: '11-50', label: '11-50 employees' },
        { value: '51-200', label: '51-200 employees' },
        { value: '201-500', label: '201-500 employees' },
        { value: '500+', label: '500+ employees' }
    ];

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        
        // Auto-generate company slug from company name
        if (field === 'companyName') {
            const slug = value.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
            setFormData(prev => ({ ...prev, companySlug: slug }));
        }
        
        // Clear errors when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const handleModuleToggle = (moduleId) => {
        setFormData(prev => ({
            ...prev,
            selectedModules: prev.selectedModules.includes(moduleId)
                ? prev.selectedModules.filter(id => id !== moduleId)
                : [...prev.selectedModules, moduleId]
        }));
    };

    const calculateTotalPrice = () => {
        if (!formData.selectedPlan) return 0;
        
        const plan = subscriptionPlans.find(p => p.id === formData.selectedPlan);
        if (!plan) return 0;
        
        let total = formData.billingCycle === 'monthly' 
            ? parseFloat(plan.base_monthly_price || 0)
            : parseFloat(plan.base_yearly_price || 0);
        
        // Add module prices
        formData.selectedModules.forEach(moduleId => {
            const module = modules.find(m => m.id === moduleId);
            if (module) {
                // Check if module is included in the plan
                const planModule = plan.modules?.find(pm => pm.id === moduleId);
                const isIncluded = planModule?.pivot?.is_included || 
                                 plan.included_modules?.includes(moduleId) || 
                                 false;
                
                if (!isIncluded) {
                    const modulePrice = formData.billingCycle === 'monthly' 
                        ? parseFloat(module.monthly_price || 0)
                        : parseFloat(module.yearly_price || 0);
                    
                    // Apply plan discount
                    const discount = parseFloat(plan.module_discount_percentage || 0);
                    const discountedPrice = modulePrice * (1 - discount / 100);
                    total += discountedPrice;
                }
            }
        });
        
        return total.toFixed(2);
    };

    const validateStep = (step) => {
        const newErrors = {};
        
        switch (step) {
            case 1:
                if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
                if (!formData.contactEmail.trim()) newErrors.contactEmail = 'Contact email is required';
                if (!formData.industry) newErrors.industry = 'Industry selection is required';
                if (!formData.companySize) newErrors.companySize = 'Company size is required';
                break;
                
            case 2:
                if (!formData.selectedPlan) newErrors.selectedPlan = 'Please select a plan';
                if (formData.selectedModules.length === 0) newErrors.selectedModules = 'Please select at least one module';
                break;
                
            case 3:
                if (!formData.adminName.trim()) newErrors.adminName = 'Admin name is required';
                if (!formData.adminEmail.trim()) newErrors.adminEmail = 'Admin email is required';
                if (!formData.password) newErrors.password = 'Password is required';
                if (formData.password !== formData.passwordConfirmation) {
                    newErrors.passwordConfirmation = 'Passwords do not match';
                }
                break;
                
            case 4:
                if (!formData.agreeToTerms) newErrors.agreeToTerms = 'You must agree to the terms';
                break;
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, steps.length));
        }
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleSubmit = async () => {
        if (!validateStep(currentStep)) return;
        
        setLoading(true);
        
        try {
            router.post('/register-tenant', {
                ...formData,
                totalPrice: calculateTotalPrice()
            }, {
                onSuccess: () => {
                    // Redirect will be handled by the controller
                },
                onError: (errors) => {
                    setErrors(errors);
                    setLoading(false);
                }
            });
        } catch (error) {
            console.error('Registration error:', error);
            setLoading(false);
        }
    };

    const stepVariants = {
        hidden: { opacity: 0, x: 50 },
        visible: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -50 }
    };

    return (
        <>
            <Head title="Create Your Company Account" />
            
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
                {/* Header */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-slate-700">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold">A</span>
                                </div>
                                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Aero Enterprise Suite
                                </span>
                            </div>
                            <Button
                                variant="light"
                                startContent={<ArrowLeftIcon className="w-4 h-4" />}
                                as="a"
                                href="/"
                            >
                                Back to Home
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Progress Steps */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            {steps.map((step, index) => {
                                const StepIcon = step.icon;
                                const isActive = currentStep === step.id;
                                const isCompleted = currentStep > step.id;
                                
                                return (
                                    <div key={step.id} className="flex items-center">
                                        <div className={`
                                            w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                                            ${isActive ? 'bg-blue-600 text-white' : 
                                              isCompleted ? 'bg-green-600 text-white' : 
                                              'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400'}
                                        `}>
                                            {isCompleted ? (
                                                <CheckIcon className="w-5 h-5" />
                                            ) : (
                                                <StepIcon className="w-5 h-5" />
                                            )}
                                        </div>
                                        
                                        {index < steps.length - 1 && (
                                            <div className={`
                                                w-20 h-1 mx-4 transition-all duration-300
                                                ${isCompleted ? 'bg-green-600' : 'bg-gray-200 dark:bg-slate-700'}
                                            `} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                {steps[currentStep - 1].title}
                            </h2>
                            <p className="text-gray-600 dark:text-gray-300">
                                {steps[currentStep - 1].description}
                            </p>
                        </div>
                        
                        <Progress 
                            value={(currentStep / steps.length) * 100} 
                            color="primary"
                            className="mt-6"
                        />
                    </div>

                    {/* Step Content */}
                    <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-0 shadow-xl">
                        <CardBody className="p-8">
                            <AnimatePresence mode="wait">
                                {/* Step 1: Company Information */}
                                {currentStep === 1 && (
                                    <motion.div
                                        key="step1"
                                        variants={stepVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                        transition={{ duration: 0.3 }}
                                        className="space-y-6"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <Input
                                                label="Company Name"
                                                placeholder="Enter your company name"
                                                value={formData.companyName}
                                                onValueChange={(value) => handleInputChange('companyName', value)}
                                                isInvalid={!!errors.companyName}
                                                errorMessage={errors.companyName}
                                                isRequired
                                            />
                                            <Input
                                                label="Company Subdomain"
                                                placeholder="your-company"
                                                value={formData.companySlug}
                                                onValueChange={(value) => handleInputChange('companySlug', value)}
                                                endContent={<span className="text-small text-gray-500">.aero.com</span>}
                                                description="This will be your unique company URL"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <Input
                                                type="email"
                                                label="Contact Email"
                                                placeholder="contact@yourcompany.com"
                                                value={formData.contactEmail}
                                                onValueChange={(value) => handleInputChange('contactEmail', value)}
                                                isInvalid={!!errors.contactEmail}
                                                errorMessage={errors.contactEmail}
                                                isRequired
                                            />
                                            <Input
                                                label="Phone Number"
                                                placeholder="+1 (555) 123-4567"
                                                value={formData.contactPhone}
                                                onValueChange={(value) => handleInputChange('contactPhone', value)}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <Select
                                                label="Industry"
                                                placeholder="Select your industry"
                                                selectedKeys={formData.industry ? [formData.industry] : []}
                                                onSelectionChange={(keys) => handleInputChange('industry', Array.from(keys)[0])}
                                                isInvalid={!!errors.industry}
                                                errorMessage={errors.industry}
                                                isRequired
                                            >
                                                {industries.map((industry) => (
                                                    <SelectItem key={industry} value={industry}>
                                                        {industry}
                                                    </SelectItem>
                                                ))}
                                            </Select>
                                            
                                            <Select
                                                label="Company Size"
                                                placeholder="Select company size"
                                                selectedKeys={formData.companySize ? [formData.companySize] : []}
                                                onSelectionChange={(keys) => handleInputChange('companySize', Array.from(keys)[0])}
                                                isInvalid={!!errors.companySize}
                                                errorMessage={errors.companySize}
                                                isRequired
                                            >
                                                {companySizes.map((size) => (
                                                    <SelectItem key={size.value} value={size.value}>
                                                        {size.label}
                                                    </SelectItem>
                                                ))}
                                            </Select>
                                        </div>

                                        <Input
                                            label="Website (Optional)"
                                            placeholder="https://yourcompany.com"
                                            value={formData.website}
                                            onValueChange={(value) => handleInputChange('website', value)}
                                        />

                                        <Textarea
                                            label="Company Description (Optional)"
                                            placeholder="Tell us about your company..."
                                            value={formData.description}
                                            onValueChange={(value) => handleInputChange('description', value)}
                                            minRows={3}
                                        />
                                    </motion.div>
                                )}

                                {/* Step 2: Plan Selection */}
                                {currentStep === 2 && (
                                    <motion.div
                                        key="step2"
                                        variants={stepVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                        transition={{ duration: 0.3 }}
                                        className="space-y-8"
                                    >
                                        {/* Billing Cycle Toggle */}
                                        <div className="text-center">
                                            <div className="inline-flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
                                                <Button
                                                    size="sm"
                                                    variant={formData.billingCycle === 'monthly' ? 'solid' : 'light'}
                                                    color={formData.billingCycle === 'monthly' ? 'primary' : 'default'}
                                                    onPress={() => handleInputChange('billingCycle', 'monthly')}
                                                >
                                                    Monthly
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant={formData.billingCycle === 'yearly' ? 'solid' : 'light'}
                                                    color={formData.billingCycle === 'yearly' ? 'primary' : 'default'}
                                                    onPress={() => handleInputChange('billingCycle', 'yearly')}
                                                >
                                                    Yearly
                                                    <Chip size="sm" color="success" variant="flat" className="ml-2">
                                                        Save 15%
                                                    </Chip>
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Plan Selection */}
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                                Choose Your Base Plan
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                {subscriptionPlans.map((plan) => (
                                                    <Card
                                                        key={plan.id}
                                                        isPressable
                                                        isHoverable
                                                        className={`
                                                            relative cursor-pointer transition-all duration-300
                                                            ${formData.selectedPlan === plan.id 
                                                                ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                                                                : 'hover:shadow-lg'
                                                            }
                                                            ${plan.is_popular ? 'border-blue-500' : ''}
                                                        `}
                                                        onPress={() => handleInputChange('selectedPlan', plan.id)}
                                                    >
                                                        {plan.is_popular && (
                                                            <Chip
                                                                color="primary"
                                                                size="sm"
                                                                className="absolute -top-2 left-1/2 -translate-x-1/2 z-10"
                                                            >
                                                                Most Popular
                                                            </Chip>
                                                        )}
                                                        <CardHeader className="pb-2">
                                                            <div className="w-full text-center">
                                                                <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                                                                    {plan.name}
                                                                </h4>
                                                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                                                    {plan.description}
                                                                </p>
                                                            </div>
                                                        </CardHeader>
                                                        <CardBody className="pt-2">
                                                            <div className="text-center mb-4">
                                                                <span className="text-3xl font-bold text-blue-600">
                                                                    ${formData.billingCycle === 'monthly' 
                                                                        ? plan.base_monthly_price 
                                                                        : plan.base_yearly_price}
                                                                </span>
                                                                <span className="text-gray-500 ml-1">
                                                                    /{formData.billingCycle === 'monthly' ? 'month' : 'year'}
                                                                </span>
                                                            </div>
                                                            
                                                            <div className="space-y-2 text-sm">
                                                                <div className="flex items-center text-gray-600 dark:text-gray-300">
                                                                    <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                                                                    {plan.max_employees ? `Up to ${plan.max_employees} employees` : 'Unlimited employees'}
                                                                </div>
                                                                <div className="flex items-center text-gray-600 dark:text-gray-300">
                                                                    <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                                                                    {plan.max_storage_gb ? `${plan.max_storage_gb}GB storage` : 'Unlimited storage'}
                                                                </div>
                                                                <div className="flex items-center text-gray-600 dark:text-gray-300">
                                                                    <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                                                                    {plan.module_discount_percentage}% discount on modules
                                                                </div>
                                                            </div>
                                                        </CardBody>
                                                    </Card>
                                                ))}
                                            </div>
                                            {errors.selectedPlan && (
                                                <p className="text-red-500 text-sm mt-2">{errors.selectedPlan}</p>
                                            )}
                                        </div>

                                        {/* Module Selection */}
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                                Select Additional Modules
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {modules.map((module) => {
                                                    const selectedPlan = subscriptionPlans.find(p => p.id === formData.selectedPlan);
                                                    const isIncluded = selectedPlan?.included_modules?.includes(module.id);
                                                    const isSelected = formData.selectedModules.includes(module.id);
                                                    
                                                    return (
                                                        <Card
                                                            key={module.id}
                                                            className={`
                                                                cursor-pointer transition-all duration-300
                                                                ${isSelected || isIncluded 
                                                                    ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                                                                    : 'hover:shadow-md'
                                                                }
                                                                ${isIncluded ? 'opacity-75' : ''}
                                                            `}
                                                        >
                                                            <CardBody className="p-4">
                                                                <div className="flex items-start justify-between">
                                                                    <div className="flex items-start space-x-3 flex-1">
                                                                        <Checkbox
                                                                            isSelected={isSelected || isIncluded}
                                                                            isDisabled={isIncluded}
                                                                            onValueChange={() => !isIncluded && handleModuleToggle(module.id)}
                                                                        />
                                                                        <div className="flex-1">
                                                                            <div className="flex items-center space-x-2 mb-1">
                                                                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                                                                    {module.name}
                                                                                </h4>
                                                                                {isIncluded && (
                                                                                    <Chip size="sm" color="success" variant="flat">
                                                                                        Included
                                                                                    </Chip>
                                                                                )}
                                                                            </div>
                                                                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                                                                {module.description}
                                                                            </p>
                                                                            <div className="flex items-center justify-between">
                                                                                <span className="text-sm font-semibold text-blue-600">
                                                                                    {isIncluded ? 'FREE' : 
                                                                                        `$${formData.billingCycle === 'monthly' 
                                                                                            ? module.monthly_price 
                                                                                            : module.yearly_price
                                                                                        }/${formData.billingCycle === 'monthly' ? 'mo' : 'yr'}`
                                                                                    }
                                                                                </span>
                                                                                {module.features && (
                                                                                    <span className="text-xs text-gray-500">
                                                                                        {module.features.length} features
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </CardBody>
                                                        </Card>
                                                    );
                                                })}
                                            </div>
                                            {errors.selectedModules && (
                                                <p className="text-red-500 text-sm mt-2">{errors.selectedModules}</p>
                                            )}
                                        </div>

                                        {/* Price Summary */}
                                        {formData.selectedPlan && (
                                            <Card className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                                                <CardBody className="p-6">
                                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                                        Price Summary
                                                    </h4>
                                                    <div className="space-y-2 text-sm">
                                                        <div className="flex justify-between">
                                                            <span>Base Plan ({subscriptionPlans.find(p => p.id === formData.selectedPlan)?.name})</span>
                                                            <span>${formData.billingCycle === 'monthly' 
                                                                ? subscriptionPlans.find(p => p.id === formData.selectedPlan)?.base_monthly_price 
                                                                : subscriptionPlans.find(p => p.id === formData.selectedPlan)?.base_yearly_price
                                                            }</span>
                                                        </div>
                                                        {formData.selectedModules.map(moduleId => {
                                                            const module = modules.find(m => m.id === moduleId);
                                                            const selectedPlan = subscriptionPlans.find(p => p.id === formData.selectedPlan);
                                                            const isIncluded = selectedPlan?.included_modules?.includes(moduleId);
                                                            
                                                            if (!module || isIncluded) return null;
                                                            
                                                            return (
                                                                <div key={moduleId} className="flex justify-between">
                                                                    <span>{module.name}</span>
                                                                    <span>${formData.billingCycle === 'monthly' 
                                                                        ? module.monthly_price 
                                                                        : module.yearly_price
                                                                    }</span>
                                                                </div>
                                                            );
                                                        })}
                                                        <Divider className="my-2" />
                                                        <div className="flex justify-between text-lg font-semibold text-blue-600">
                                                            <span>Total</span>
                                                            <span>${calculateTotalPrice()}/{formData.billingCycle === 'monthly' ? 'month' : 'year'}</span>
                                                        </div>
                                                    </div>
                                                </CardBody>
                                            </Card>
                                        )}
                                    </motion.div>
                                )}

                                {/* Step 3: Admin Account */}
                                {currentStep === 3 && (
                                    <motion.div
                                        key="step3"
                                        variants={stepVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                        transition={{ duration: 0.3 }}
                                        className="space-y-6"
                                    >
                                        <div className="text-center mb-6">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                                Create Your Admin Account
                                            </h3>
                                            <p className="text-gray-600 dark:text-gray-300">
                                                This will be the primary administrator account for your company
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <Input
                                                label="Full Name"
                                                placeholder="John Doe"
                                                value={formData.adminName}
                                                onValueChange={(value) => handleInputChange('adminName', value)}
                                                isInvalid={!!errors.adminName}
                                                errorMessage={errors.adminName}
                                                isRequired
                                            />
                                            <Input
                                                type="email"
                                                label="Email Address"
                                                placeholder="admin@yourcompany.com"
                                                value={formData.adminEmail}
                                                onValueChange={(value) => handleInputChange('adminEmail', value)}
                                                isInvalid={!!errors.adminEmail}
                                                errorMessage={errors.adminEmail}
                                                isRequired
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <Input
                                                type="password"
                                                label="Password"
                                                placeholder="Choose a strong password"
                                                value={formData.password}
                                                onValueChange={(value) => handleInputChange('password', value)}
                                                isInvalid={!!errors.password}
                                                errorMessage={errors.password}
                                                isRequired
                                            />
                                            <Input
                                                type="password"
                                                label="Confirm Password"
                                                placeholder="Confirm your password"
                                                value={formData.passwordConfirmation}
                                                onValueChange={(value) => handleInputChange('passwordConfirmation', value)}
                                                isInvalid={!!errors.passwordConfirmation}
                                                errorMessage={errors.passwordConfirmation}
                                                isRequired
                                            />
                                        </div>

                                        <Select
                                            label="Timezone"
                                            placeholder="Select your timezone"
                                            selectedKeys={[formData.timezone]}
                                            onSelectionChange={(keys) => handleInputChange('timezone', Array.from(keys)[0])}
                                        >
                                            <SelectItem key="UTC" value="UTC">UTC</SelectItem>
                                            <SelectItem key="America/New_York" value="America/New_York">Eastern Time</SelectItem>
                                            <SelectItem key="America/Chicago" value="America/Chicago">Central Time</SelectItem>
                                            <SelectItem key="America/Denver" value="America/Denver">Mountain Time</SelectItem>
                                            <SelectItem key="America/Los_Angeles" value="America/Los_Angeles">Pacific Time</SelectItem>
                                        </Select>
                                    </motion.div>
                                )}

                                {/* Step 4: Review & Finalize */}
                                {currentStep === 4 && (
                                    <motion.div
                                        key="step4"
                                        variants={stepVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                        transition={{ duration: 0.3 }}
                                        className="space-y-6"
                                    >
                                        <div className="text-center mb-6">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                                Review Your Setup
                                            </h3>
                                            <p className="text-gray-600 dark:text-gray-300">
                                                Please review your information before completing the setup
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <Card>
                                                <CardHeader>
                                                    <h4 className="font-semibold">Company Information</h4>
                                                </CardHeader>
                                                <CardBody className="pt-0 space-y-2 text-sm">
                                                    <div><strong>Name:</strong> {formData.companyName}</div>
                                                    <div><strong>Domain:</strong> {formData.companySlug}.aero.com</div>
                                                    <div><strong>Email:</strong> {formData.contactEmail}</div>
                                                    <div><strong>Industry:</strong> {formData.industry}</div>
                                                    <div><strong>Size:</strong> {companySizes.find(s => s.value === formData.companySize)?.label}</div>
                                                </CardBody>
                                            </Card>

                                            <Card>
                                                <CardHeader>
                                                    <h4 className="font-semibold">Subscription Details</h4>
                                                </CardHeader>
                                                <CardBody className="pt-0 space-y-2 text-sm">
                                                    <div><strong>Plan:</strong> {subscriptionPlans.find(p => p.id === formData.selectedPlan)?.name}</div>
                                                    <div><strong>Billing:</strong> {formData.billingCycle}</div>
                                                    <div><strong>Modules:</strong> {formData.selectedModules.length} selected</div>
                                                    <div><strong>Total:</strong> ${calculateTotalPrice()}/{formData.billingCycle === 'monthly' ? 'month' : 'year'}</div>
                                                </CardBody>
                                            </Card>
                                        </div>

                                        <Checkbox
                                            isSelected={formData.agreeToTerms}
                                            onValueChange={(checked) => handleInputChange('agreeToTerms', checked)}
                                            isInvalid={!!errors.agreeToTerms}
                                        >
                                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                                I agree to the{' '}
                                                <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>
                                                {' '}and{' '}
                                                <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
                                            </span>
                                        </Checkbox>
                                        {errors.agreeToTerms && (
                                            <p className="text-red-500 text-sm">{errors.agreeToTerms}</p>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </CardBody>
                    </Card>

                    {/* Navigation Buttons */}
                    <div className="flex justify-between mt-8">
                        <Button
                            variant="bordered"
                            startContent={<ArrowLeftIcon className="w-4 h-4" />}
                            onPress={prevStep}
                            isDisabled={currentStep === 1}
                        >
                            Previous
                        </Button>

                        {currentStep < steps.length ? (
                            <Button
                                color="primary"
                                endContent={<ArrowRightIcon className="w-4 h-4" />}
                                onPress={nextStep}
                            >
                                Next
                            </Button>
                        ) : (
                            <Button
                                color="success"
                                endContent={<CheckIcon className="w-4 h-4" />}
                                onPress={handleSubmit}
                                isLoading={loading}
                            >
                                Complete Setup
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}