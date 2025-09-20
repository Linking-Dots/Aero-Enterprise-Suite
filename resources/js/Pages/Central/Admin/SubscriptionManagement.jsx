import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Input,
    Textarea,
    Switch,
    Select,
    SelectItem,
    useDisclosure,
    Tabs,
    Tab
} from '@heroui/react';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    EllipsisVerticalIcon,
    CogIcon,
    CurrencyDollarIcon,
    UsersIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline';
import AdminApp from "@/Layouts/AdminApp.jsx";

export default function AdminSubscriptionManagement({ subscriptionPlans = [], modules = [], stats = {} }) {
    const [activeTab, setActiveTab] = useState('plans');
    const { isOpen: isPlanModalOpen, onOpen: onPlanModalOpen, onClose: onPlanModalClose } = useDisclosure();
    const { isOpen: isModuleModalOpen, onOpen: onModuleModalOpen, onClose: onModuleModalClose } = useDisclosure();
    
    const [editingPlan, setEditingPlan] = useState(null);
    const [editingModule, setEditingModule] = useState(null);
    const [planForm, setPlanForm] = useState({
        name: '',
        description: '',
        base_monthly_price: 0,
        base_yearly_price: 0,
        max_employees: null,
        max_storage_gb: null,
        module_discount_percentage: 0,
        is_popular: false,
        is_active: true,
        features: []
    });
    
    const [moduleForm, setModuleForm] = useState({
        name: '',
        description: '',
        monthly_price: 0,
        yearly_price: 0,
        features: [],
        dependencies: [],
        icon: '',
        is_active: true
    });

    const handlePlanSubmit = () => {
        const url = editingPlan ? `/admin/subscription-plans/${editingPlan.id}` : '/admin/subscription-plans';
        const method = editingPlan ? 'put' : 'post';
        
        router[method](url, planForm, {
            onSuccess: () => {
                onPlanModalClose();
                resetPlanForm();
            }
        });
    };

    const handleModuleSubmit = () => {
        const url = editingModule ? `/admin/modules/${editingModule.id}` : '/admin/modules';
        const method = editingModule ? 'put' : 'post';
        
        router[method](url, moduleForm, {
            onSuccess: () => {
                onModuleModalClose();
                resetModuleForm();
            }
        });
    };

    const resetPlanForm = () => {
        setPlanForm({
            name: '',
            description: '',
            base_monthly_price: 0,
            base_yearly_price: 0,
            max_employees: null,
            max_storage_gb: null,
            module_discount_percentage: 0,
            is_popular: false,
            is_active: true,
            features: []
        });
        setEditingPlan(null);
    };

    const resetModuleForm = () => {
        setModuleForm({
            name: '',
            description: '',
            monthly_price: 0,
            yearly_price: 0,
            features: [],
            dependencies: [],
            icon: '',
            is_active: true
        });
        setEditingModule(null);
    };

    const openEditPlan = (plan) => {
        setEditingPlan(plan);
        setPlanForm({
            name: plan.name,
            description: plan.description,
            base_monthly_price: plan.base_monthly_price,
            base_yearly_price: plan.base_yearly_price,
            max_employees: plan.max_employees,
            max_storage_gb: plan.max_storage_gb,
            module_discount_percentage: plan.module_discount_percentage,
            is_popular: plan.is_popular,
            is_active: plan.is_active,
            features: plan.features || []
        });
        onPlanModalOpen();
    };

    const openEditModule = (module) => {
        setEditingModule(module);
        setModuleForm({
            name: module.name,
            description: module.description,
            monthly_price: module.monthly_price,
            yearly_price: module.yearly_price,
            features: module.features || [],
            dependencies: module.dependencies || [],
            icon: module.icon || '',
            is_active: module.is_active
        });
        onModuleModalOpen();
    };

    const deletePlan = (planId) => {
        if (confirm('Are you sure you want to delete this plan?')) {
            router.delete(`/admin/subscription-plans/${planId}`);
        }
    };

    const deleteModule = (moduleId) => {
        if (confirm('Are you sure you want to delete this module?')) {
            router.delete(`/admin/modules/${moduleId}`);
        }
    };

    return (
        <>
            <Head title="Subscription Management" />
            
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        Subscription Management
                    </h1>
                    <p className="text-foreground-500">
                        Manage subscription plans, modules, and pricing for your SaaS platform
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card className="border-small border-divider">
                        <CardBody className="p-6">
                            <div className="flex items-center">
                                <div className="p-3 bg-primary/10 rounded-lg">
                                    <CurrencyDollarIcon className="w-6 h-6 text-primary" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-foreground-500">
                                        Active Plans
                                    </p>
                                    <p className="text-2xl font-semibold text-foreground">
                                        {stats.activePlans || subscriptionPlans.filter(p => p.is_active).length}
                                    </p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                    
                    <Card className="border-small border-divider">
                        <CardBody className="p-6">
                            <div className="flex items-center">
                                <div className="p-3 bg-success/10 rounded-lg">
                                    <CogIcon className="w-6 h-6 text-success" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-foreground-500">
                                        Active Modules
                                    </p>
                                    <p className="text-2xl font-semibold text-foreground">
                                        {stats.activeModules || modules.filter(m => m.is_active).length}
                                    </p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                    
                    <Card className="border-small border-divider">
                        <CardBody className="p-6">
                            <div className="flex items-center">
                                <div className="p-3 bg-secondary/10 rounded-lg">
                                    <UsersIcon className="w-6 h-6 text-secondary" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-foreground-500">
                                        Total Subscribers
                                    </p>
                                    <p className="text-2xl font-semibold text-foreground">
                                        {stats.totalSubscribers || 0}
                                    </p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                    
                    <Card className="border-small border-divider">
                        <CardBody className="p-6">
                            <div className="flex items-center">
                                <div className="p-3 bg-warning/10 rounded-lg">
                                    <ChartBarIcon className="w-6 h-6 text-warning" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-foreground-500">
                                        Monthly Revenue
                                    </p>
                                    <p className="text-2xl font-semibold text-foreground">
                                        ${stats.monthlyRevenue || '0'}
                                    </p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Main Content */}
                <Card className="border-small border-divider">
                    <CardHeader className="border-b border-divider">
                        <div className="flex justify-between items-center w-full">
                            <Tabs 
                                selectedKey={activeTab} 
                                onSelectionChange={setActiveTab}
                                variant="underlined"
                                color="primary"
                            >
                                <Tab key="plans" title="Subscription Plans" />
                                <Tab key="modules" title="Modules" />
                            </Tabs>
                            
                            <Button
                                color="primary"
                                startContent={<PlusIcon className="w-4 h-4" />}
                                onPress={activeTab === 'plans' ? onPlanModalOpen : onModuleModalOpen}
                            >
                                Add {activeTab === 'plans' ? 'Plan' : 'Module'}
                            </Button>
                        </div>
                    </CardHeader>
                    
                    <CardBody className="p-0">
                        {activeTab === 'plans' && (
                            <Table aria-label="Subscription plans table">
                                <TableHeader>
                                    <TableColumn>PLAN</TableColumn>
                                    <TableColumn>PRICING</TableColumn>
                                    <TableColumn>LIMITS</TableColumn>
                                    <TableColumn>DISCOUNT</TableColumn>
                                    <TableColumn>STATUS</TableColumn>
                                    <TableColumn>ACTIONS</TableColumn>
                                </TableHeader>
                                <TableBody>
                                    {subscriptionPlans.map((plan) => (
                                        <TableRow key={plan.id}>
                                            <TableCell>
                                                <div>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="font-semibold">{plan.name}</span>
                                                        {plan.is_popular && (
                                                            <Chip size="sm" color="warning" variant="flat">
                                                                Popular
                                                            </Chip>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-foreground-500">{plan.description}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    <div>${plan.base_monthly_price}/month</div>
                                                    <div className="text-foreground-500">${plan.base_yearly_price}/year</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    <div>{plan.max_employees ? `${plan.max_employees} employees` : 'Unlimited'}</div>
                                                    <div className="text-foreground-500">
                                                        {plan.max_storage_gb ? `${plan.max_storage_gb}GB storage` : 'Unlimited'}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Chip size="sm" color="success" variant="flat">
                                                    {plan.module_discount_percentage}%
                                                </Chip>
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    size="sm" 
                                                    color={plan.is_active ? 'success' : 'default'} 
                                                    variant="flat"
                                                >
                                                    {plan.is_active ? 'Active' : 'Inactive'}
                                                </Chip>
                                            </TableCell>
                                            <TableCell>
                                                <Dropdown>
                                                    <DropdownTrigger>
                                                        <Button isIconOnly size="sm" variant="light">
                                                            <EllipsisVerticalIcon className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownTrigger>
                                                    <DropdownMenu>
                                                        <DropdownItem 
                                                            key="edit"
                                                            startContent={<PencilIcon className="w-4 h-4" />}
                                                            onPress={() => openEditPlan(plan)}
                                                        >
                                                            Edit
                                                        </DropdownItem>
                                                        <DropdownItem 
                                                            key="delete"
                                                            className="text-danger"
                                                            color="danger"
                                                            startContent={<TrashIcon className="w-4 h-4" />}
                                                            onPress={() => deletePlan(plan.id)}
                                                        >
                                                            Delete
                                                        </DropdownItem>
                                                    </DropdownMenu>
                                                </Dropdown>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}

                        {activeTab === 'modules' && (
                            <Table aria-label="Modules table">
                                <TableHeader>
                                    <TableColumn>MODULE</TableColumn>
                                    <TableColumn>PRICING</TableColumn>
                                    <TableColumn>DEPENDENCIES</TableColumn>
                                    <TableColumn>STATUS</TableColumn>
                                    <TableColumn>ACTIONS</TableColumn>
                                </TableHeader>
                                <TableBody>
                                    {modules.map((module) => (
                                        <TableRow key={module.id}>
                                            <TableCell>
                                                <div>
                                                    <div className="font-semibold">{module.name}</div>
                                                    <p className="text-sm text-foreground-500">{module.description}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    <div>${module.monthly_price}/month</div>
                                                    <div className="text-foreground-500">${module.yearly_price}/year</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {module.dependencies && module.dependencies.length > 0 ? (
                                                        module.dependencies.map((dep, index) => (
                                                            <Chip key={index} size="sm" variant="flat">
                                                                {dep}
                                                            </Chip>
                                                        ))
                                                    ) : (
                                                        <span className="text-foreground-500 text-sm">None</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    size="sm" 
                                                    color={module.is_active ? 'success' : 'default'} 
                                                    variant="flat"
                                                >
                                                    {module.is_active ? 'Active' : 'Inactive'}
                                                </Chip>
                                            </TableCell>
                                            <TableCell>
                                                <Dropdown>
                                                    <DropdownTrigger>
                                                        <Button isIconOnly size="sm" variant="light">
                                                            <EllipsisVerticalIcon className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownTrigger>
                                                    <DropdownMenu>
                                                        <DropdownItem 
                                                            key="edit"
                                                            startContent={<PencilIcon className="w-4 h-4" />}
                                                            onPress={() => openEditModule(module)}
                                                        >
                                                            Edit
                                                        </DropdownItem>
                                                        <DropdownItem 
                                                            key="delete"
                                                            className="text-danger"
                                                            color="danger"
                                                            startContent={<TrashIcon className="w-4 h-4" />}
                                                            onPress={() => deleteModule(module.id)}
                                                        >
                                                            Delete
                                                        </DropdownItem>
                                                    </DropdownMenu>
                                                </Dropdown>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardBody>
                </Card>
            </div>

            {/* Plan Modal */}
            <Modal isOpen={isPlanModalOpen} onClose={onPlanModalClose} size="2xl" scrollBehavior="inside">
                <ModalContent>
                    <ModalHeader>
                        {editingPlan ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}
                    </ModalHeader>
                    <ModalBody>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Plan Name"
                                    placeholder="e.g., Professional"
                                    value={planForm.name}
                                    onValueChange={(value) => setPlanForm(prev => ({ ...prev, name: value }))}
                                />
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        isSelected={planForm.is_popular}
                                        onValueChange={(checked) => setPlanForm(prev => ({ ...prev, is_popular: checked }))}
                                    >
                                        Popular Plan
                                    </Switch>
                                    <Switch
                                        isSelected={planForm.is_active}
                                        onValueChange={(checked) => setPlanForm(prev => ({ ...prev, is_active: checked }))}
                                    >
                                        Active
                                    </Switch>
                                </div>
                            </div>

                            <Textarea
                                label="Description"
                                placeholder="Describe this plan..."
                                value={planForm.description}
                                onValueChange={(value) => setPlanForm(prev => ({ ...prev, description: value }))}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    type="number"
                                    label="Monthly Price ($)"
                                    value={planForm.base_monthly_price.toString()}
                                    onValueChange={(value) => setPlanForm(prev => ({ ...prev, base_monthly_price: parseFloat(value) || 0 }))}
                                />
                                <Input
                                    type="number"
                                    label="Yearly Price ($)"
                                    value={planForm.base_yearly_price.toString()}
                                    onValueChange={(value) => setPlanForm(prev => ({ ...prev, base_yearly_price: parseFloat(value) || 0 }))}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Input
                                    type="number"
                                    label="Max Employees"
                                    placeholder="Leave empty for unlimited"
                                    value={planForm.max_employees?.toString() || ''}
                                    onValueChange={(value) => setPlanForm(prev => ({ ...prev, max_employees: value ? parseInt(value) : null }))}
                                />
                                <Input
                                    type="number"
                                    label="Storage (GB)"
                                    placeholder="Leave empty for unlimited"
                                    value={planForm.max_storage_gb?.toString() || ''}
                                    onValueChange={(value) => setPlanForm(prev => ({ ...prev, max_storage_gb: value ? parseInt(value) : null }))}
                                />
                                <Input
                                    type="number"
                                    label="Module Discount (%)"
                                    value={planForm.module_discount_percentage.toString()}
                                    onValueChange={(value) => setPlanForm(prev => ({ ...prev, module_discount_percentage: parseFloat(value) || 0 }))}
                                />
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="light" onPress={onPlanModalClose}>
                            Cancel
                        </Button>
                        <Button color="primary" onPress={handlePlanSubmit}>
                            {editingPlan ? 'Update Plan' : 'Create Plan'}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Module Modal */}
            <Modal isOpen={isModuleModalOpen} onClose={onModuleModalClose} size="2xl" scrollBehavior="inside">
                <ModalContent>
                    <ModalHeader>
                        {editingModule ? 'Edit Module' : 'Create New Module'}
                    </ModalHeader>
                    <ModalBody>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Module Name"
                                    placeholder="e.g., HR Management"
                                    value={moduleForm.name}
                                    onValueChange={(value) => setModuleForm(prev => ({ ...prev, name: value }))}
                                />
                                <div className="flex items-center">
                                    <Switch
                                        isSelected={moduleForm.is_active}
                                        onValueChange={(checked) => setModuleForm(prev => ({ ...prev, is_active: checked }))}
                                    >
                                        Active
                                    </Switch>
                                </div>
                            </div>

                            <Textarea
                                label="Description"
                                placeholder="Describe this module..."
                                value={moduleForm.description}
                                onValueChange={(value) => setModuleForm(prev => ({ ...prev, description: value }))}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    type="number"
                                    label="Monthly Price ($)"
                                    value={moduleForm.monthly_price.toString()}
                                    onValueChange={(value) => setModuleForm(prev => ({ ...prev, monthly_price: parseFloat(value) || 0 }))}
                                />
                                <Input
                                    type="number"
                                    label="Yearly Price ($)"
                                    value={moduleForm.yearly_price.toString()}
                                    onValueChange={(value) => setModuleForm(prev => ({ ...prev, yearly_price: parseFloat(value) || 0 }))}
                                />
                            </div>

                            <Input
                                label="Icon"
                                placeholder="e.g., user-group"
                                value={moduleForm.icon}
                                onValueChange={(value) => setModuleForm(prev => ({ ...prev, icon: value }))}
                            />
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="light" onPress={onModuleModalClose}>
                            Cancel
                        </Button>
                        <Button color="primary" onPress={handleModuleSubmit}>
                            {editingModule ? 'Update Module' : 'Create Module'}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
}

SubscriptionManagement.layout = (page) => <AdminApp>{page}</AdminApp>;