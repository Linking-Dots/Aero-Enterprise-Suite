import {
    Avatar,
    Button,
    Spinner,
    Select,
    SelectItem,
    Input,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter
} from "@heroui/react";
import React, { useEffect, useState } from "react";
import { X, Camera, Eye, EyeOff, Lock, UserIcon, CalendarIcon } from 'lucide-react';
import { useForm } from 'laravel-precognition-react';
import { toast } from "react-toastify";


const AddEditUserForm = ({user, allUsers, departments, designations, setUsers, open, closeModal, editMode = false }) => {
    
    const [showPassword, setShowPassword] = useState(false);
    const [hover, setHover] = useState(false);
    const [selectedImage, setSelectedImage] = useState(user?.profile_image_url || user?.profile_image || null);
    const [selectedImageFile, setSelectedImageFile] = useState(null);
    const [allReportTo, setAllReportTo] = useState(allUsers);
    const [themeRadius, setThemeRadius] = useState('lg');

    // Helper function to convert theme borderRadius to HeroUI radius values
    const getThemeRadius = () => {
        if (typeof window === 'undefined') return 'lg';
        
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) return 'none';
        if (radiusValue <= 4) return 'sm';
        if (radiusValue <= 8) return 'md';
        if (radiusValue <= 16) return 'lg';
        return 'full';
    };

    // Set theme radius on mount (client-side only)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setThemeRadius(getThemeRadius());
        }
    }, []);

    // Initialize Precognition form with proper method and URL
    const form = useForm(
        editMode ? 'put' : 'post',
        editMode && user?.id ? route('users.update', { user: user.id }) : route('users.store'),
        {
            id: user?.id || '',
            name: user?.name || '',
            user_name: user?.user_name || '',
            gender: user?.gender || '',
            birthday: user?.birthday || '',
            date_of_joining: user?.date_of_joining || '',
            address: user?.address || '',
            employee_id: user?.employee_id || '',
            phone: user?.phone || '',
            email: user?.email || '',
            department_id: user?.department_id || '',
            designation_id: user?.designation_id || '',
            report_to: user?.report_to || '',
            password: '',
            password_confirmation: '',
            roles: user?.roles || [],
            profile_image: null,
        }
    );




    // Initialize selected image if user has profile image
    useEffect(() => {
        if (user?.profile_image_url || user?.profile_image) {
            setSelectedImage(user.profile_image_url || user.profile_image);
        }
    }, [user]);

    const handleSubmit = async (event) => {
        event.preventDefault();

        // Validate file type if image is selected
        if (selectedImageFile) {
            const fileType = selectedImageFile.type;
            if (!['image/jpeg', 'image/jpg', 'image/png'].includes(fileType)) {
                toast.error('Invalid file type. Only JPEG and PNG are allowed.', {
                    icon: '🔴'
                });
                return;
            }
            form.setData('profile_image', selectedImageFile);
        }

        try {
            // Submit the form using Precognition
            await form.submit({
                onSuccess: (response) => {
                    if (setUsers) {
                        if (editMode) {
                            // Update the user in the list
                            setUsers(prevUsers => 
                                prevUsers.map(u => 
                                    u.id === response.data.user.id ? response.data.user : u
                                )
                            );
                        } else {
                            // Add new user to the list
                            setUsers(prevUsers => [...prevUsers, response.data.user]);
                        }
                    }
                    
                    toast.success(response.data.messages?.length > 0
                        ? response.data.messages.join(' ')
                        : `User ${editMode ? 'updated' : 'added'} successfully`, {
                        icon: '🟢'
                    });
                    closeModal();
                },
                onError: (error) => {
                    handleErrorResponse(error);
                },
            });
        } catch (error) {
            handleErrorResponse(error);
        }
    };

    // Error handling for different scenarios
    const handleErrorResponse = (error) => {
        if (error.response) {
            if (error.response.status === 422) {
                toast.error(error.response.data.message || `Failed to ${editMode ? 'update' : 'add'} user.`, {
                    icon: '🔴'
                });
            } else {
                toast.error('An unexpected error occurred. Please try again later.', {
                    icon: '🔴'
                });
            }
        } else if (error.request) {
            toast.error('No response received from the server. Please check your internet connection.', {
                icon: '🔴'
            });
        } else {
            toast.error('An error occurred while setting up the request.', {
                icon: '🔴'
            });
        }
    };

    // Handle file change for profile image preview and submission
    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const objectURL = URL.createObjectURL(file);
            setSelectedImage(objectURL);
            setSelectedImageFile(file); // Set the file for the form submission
        }
    };

    const handleChange = (key, value) => {
        form.setData(key, value);
        
        // Trigger validation on blur for real-time feedback
        if (form.touched(key)) {
            form.validate(key);
        }
    };

    // Toggle password visibility
    const handleTogglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <Modal 
            isOpen={open} 
            onClose={closeModal}
            size="3xl"
            radius={themeRadius}
            scrollBehavior="inside"
            classNames={{
                base: "backdrop-blur-md max-h-[95vh] my-2",
                backdrop: "bg-black/50 backdrop-blur-sm",
                header: "border-b border-divider flex-shrink-0",
                body: "overflow-y-auto max-h-[calc(95vh-160px)]",
                footer: "border-t border-divider flex-shrink-0",
                closeButton: "hover:bg-white/5 active:bg-white/10"
            }}
            style={{
                border: `var(--borderWidth, 2px) solid var(--theme-divider, #E4E4E7)`,
                borderRadius: `var(--borderRadius, 12px)`,
                fontFamily: `var(--fontFamily, "Inter")`,
                transform: `scale(var(--scale, 1))`,
            }}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1 py-4" style={{
                            borderColor: `var(--theme-divider, #E4E4E7)`,
                            fontFamily: `var(--fontFamily, "Inter")`,
                        }}>
                            <div className="flex items-center gap-2">
                                <UserIcon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: 'var(--theme-primary)' }} />
                                <div>
                                    <span className="text-lg font-semibold" style={{
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}>
                                        {editMode ? 'Edit User' : 'Add New User'}
                                    </span>
                                    <p className="text-sm text-default-500 mt-0.5" style={{
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}>
                                        {editMode ? 'Update user information' : 'Create a new user account'}
                                    </p>
                                </div>
                            </div>
                        </ModalHeader>
                        
                        <ModalBody className="py-4 px-4 sm:py-6 sm:px-6 overflow-y-auto" style={{
                            fontFamily: `var(--fontFamily, "Inter")`,
                        }}>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Profile Image Upload */}
                                <div className="flex justify-center mb-6">
                                    <div 
                                        className="relative group cursor-pointer"
                                        onMouseEnter={() => setHover(true)}
                                        onMouseLeave={() => setHover(false)}
                                    >
                                        <Avatar
                                            src={selectedImage}
                                            alt="Profile"
                                            className="w-32 h-32 text-large transition-all duration-300"
                                            style={{
                                                border: `4px solid var(--theme-divider, #E4E4E7)`,
                                                filter: hover ? 'brightness(70%)' : 'brightness(100%)',
                                            }}
                                        />
                                        <label
                                            htmlFor="icon-button-file"
                                            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-opacity duration-300"
                                            style={{
                                                opacity: hover ? 1 : 0,
                                            }}
                                        >
                                            <input
                                                accept="image/*"
                                                id="icon-button-file"
                                                type="file"
                                                className="hidden"
                                                onChange={handleImageChange}
                                            />
                                            <Camera className="w-8 h-8 text-white" />
                                        </label>
                                    </div>
                                </div>

                                {/* Basic Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Full Name"
                                        placeholder="Enter full name"
                                        value={form.data.name}
                                        onChange={(e) => handleChange('name', e.target.value)}
                                        onBlur={() => form.validate('name')}
                                        isInvalid={form.invalid('name')}
                                        errorMessage={form.errors.name}
                                        isRequired
                                        variant="bordered"
                                        size="sm"
                                        radius={themeRadius}
                                        classNames={{
                                            input: "text-small",
                                            inputWrapper: "min-h-unit-10"
                                        }}
                                        style={{
                                            fontFamily: `var(--fontFamily, "Inter")`,
                                        }}
                                    />

                                    <Input
                                        label="Username"
                                        placeholder="Enter username"
                                        value={form.data.user_name}
                                        onChange={(e) => handleChange('user_name', e.target.value)}
                                        onBlur={() => form.validate('user_name')}
                                        isInvalid={form.invalid('user_name')}
                                        errorMessage={form.errors.user_name}
                                        isRequired
                                        variant="bordered"
                                        size="sm"
                                        radius={themeRadius}
                                        classNames={{
                                            input: "text-small",
                                            inputWrapper: "min-h-unit-10"
                                        }}
                                        style={{
                                            fontFamily: `var(--fontFamily, "Inter")`,
                                        }}
                                    />

                                    <Input
                                        label="Email"
                                        type="email"
                                        placeholder="Enter email address"
                                        value={form.data.email}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                        onBlur={() => form.validate('email')}
                                        isInvalid={form.invalid('email')}
                                        errorMessage={form.errors.email}
                                        isRequired
                                        variant="bordered"
                                        size="sm"
                                        radius={themeRadius}
                                        classNames={{
                                            input: "text-small",
                                            inputWrapper: "min-h-unit-10"
                                        }}
                                        style={{
                                            fontFamily: `var(--fontFamily, "Inter")`,
                                        }}
                                    />

                                    <Input
                                        label="Phone"
                                        placeholder="Enter phone number"
                                        value={form.data.phone}
                                        onChange={(e) => handleChange('phone', e.target.value)}
                                        onBlur={() => form.validate('phone')}
                                        isInvalid={form.invalid('phone')}
                                        errorMessage={form.errors.phone}
                                        variant="bordered"
                                        size="sm"
                                        radius={themeRadius}
                                        classNames={{
                                            input: "text-small",
                                            inputWrapper: "min-h-unit-10"
                                        }}
                                        style={{
                                            fontFamily: `var(--fontFamily, "Inter")`,
                                        }}
                                    />

                                    <Select
                                        label="Department"
                                        placeholder="Select department"
                                        selectedKeys={form.data.department_id ? new Set([String(form.data.department_id)]) : new Set()}
                                        onSelectionChange={(keys) => {
                                            const value = Array.from(keys)[0];
                                            handleChange('department_id', value || '');
                                        }}
                                        onClose={() => form.validate('department_id')}
                                        isInvalid={form.invalid('department_id')}
                                        errorMessage={form.errors.department_id}
                                        variant="bordered"
                                        size="sm"
                                        radius={themeRadius}
                                        classNames={{
                                            trigger: "min-h-unit-10",
                                            value: "text-small"
                                        }}
                                        style={{
                                            fontFamily: `var(--fontFamily, "Inter")`,
                                        }}
                                    >
                                        {departments?.map((department) => (
                                            <SelectItem key={department.id} value={department.id}>
                                                {department.name}
                                            </SelectItem>
                                        ))}
                                    </Select>

                                    <Select
                                        label="Designation"
                                        placeholder="Select designation"
                                        selectedKeys={form.data.designation_id ? new Set([String(form.data.designation_id)]) : new Set()}
                                        onSelectionChange={(keys) => {
                                            const value = Array.from(keys)[0];
                                            handleChange('designation_id', value || '');
                                        }}
                                        onClose={() => form.validate('designation_id')}
                                        isInvalid={form.invalid('designation_id')}
                                        errorMessage={form.errors.designation_id}
                                        variant="bordered"
                                        size="sm"
                                        radius={themeRadius}
                                        classNames={{
                                            trigger: "min-h-unit-10",
                                            value: "text-small"
                                        }}
                                        style={{
                                            fontFamily: `var(--fontFamily, "Inter")`,
                                        }}
                                    >
                                        {designations?.map((designation) => (
                                            <SelectItem key={designation.id} value={designation.id}>
                                                {designation.name}
                                            </SelectItem>
                                        ))}
                                    </Select>

                                    <Select
                                        label="Gender"
                                        placeholder="Select gender"
                                        selectedKeys={form.data.gender ? new Set([form.data.gender]) : new Set()}
                                        onSelectionChange={(keys) => {
                                            const value = Array.from(keys)[0];
                                            handleChange('gender', value || '');
                                        }}
                                        onClose={() => form.validate('gender')}
                                        isInvalid={form.invalid('gender')}
                                        errorMessage={form.errors.gender}
                                        variant="bordered"
                                        size="sm"
                                        radius={themeRadius}
                                        classNames={{
                                            trigger: "min-h-unit-10",
                                            value: "text-small"
                                        }}
                                        style={{
                                            fontFamily: `var(--fontFamily, "Inter")`,
                                        }}
                                    >
                                        <SelectItem key="male" value="male">Male</SelectItem>
                                        <SelectItem key="female" value="female">Female</SelectItem>
                                        <SelectItem key="other" value="other">Other</SelectItem>
                                    </Select>

                                    <Input
                                        label="Employee ID"
                                        placeholder="Enter employee ID"
                                        value={form.data.employee_id}
                                        onChange={(e) => handleChange('employee_id', e.target.value)}
                                        onBlur={() => form.validate('employee_id')}
                                        isInvalid={form.invalid('employee_id')}
                                        errorMessage={form.errors.employee_id}
                                        variant="bordered"
                                        size="sm"
                                        radius={themeRadius}
                                        classNames={{
                                            input: "text-small",
                                            inputWrapper: "min-h-unit-10"
                                        }}
                                        style={{
                                            fontFamily: `var(--fontFamily, "Inter")`,
                                        }}
                                    />

                                    <Input
                                        label="Date of Birth"
                                        type="date"
                                        value={form.data.birthday}
                                        onChange={(e) => handleChange('birthday', e.target.value)}
                                        onBlur={() => form.validate('birthday')}
                                        isInvalid={form.invalid('birthday')}
                                        errorMessage={form.errors.birthday}
                                        variant="bordered"
                                        size="sm"
                                        radius={themeRadius}
                                        classNames={{
                                            input: "text-small",
                                            inputWrapper: "min-h-unit-10"
                                        }}
                                        style={{
                                            fontFamily: `var(--fontFamily, "Inter")`,
                                        }}
                                    />

                                    <Input
                                        label="Date of Joining"
                                        type="date"
                                        value={form.data.date_of_joining}
                                        onChange={(e) => handleChange('date_of_joining', e.target.value)}
                                        onBlur={() => form.validate('date_of_joining')}
                                        isInvalid={form.invalid('date_of_joining')}
                                        errorMessage={form.errors.date_of_joining}
                                        variant="bordered"
                                        size="sm"
                                        radius={themeRadius}
                                        classNames={{
                                            input: "text-small",
                                            inputWrapper: "min-h-unit-10"
                                        }}
                                        style={{
                                            fontFamily: `var(--fontFamily, "Inter")`,
                                        }}
                                    />

                                    <Select
                                        label="Reports To"
                                        placeholder="Select supervisor"
                                        selectedKeys={form.data.report_to ? new Set([String(form.data.report_to)]) : new Set()}
                                        onSelectionChange={(keys) => {
                                            const value = Array.from(keys)[0];
                                            handleChange('report_to', value || '');
                                        }}
                                        onClose={() => form.validate('report_to')}
                                        isInvalid={form.invalid('report_to')}
                                        errorMessage={form.errors.report_to}
                                        variant="bordered"
                                        size="sm"
                                        radius={themeRadius}
                                        classNames={{
                                            trigger: "min-h-unit-10",
                                            value: "text-small"
                                        }}
                                        style={{
                                            fontFamily: `var(--fontFamily, "Inter")`,
                                        }}
                                    >
                                        {allReportTo?.filter(u => u.id !== form.data.id).map((user) => (
                                            <SelectItem key={user.id} value={user.id}>
                                                {user.name}
                                            </SelectItem>
                                        ))}
                                    </Select>
                                </div>

                                {/* Address - Full Width */}
                                <Input
                                    label="Address"
                                    placeholder="Enter address"
                                    value={form.data.address}
                                    onChange={(e) => handleChange('address', e.target.value)}
                                    onBlur={() => form.validate('address')}
                                    isInvalid={form.invalid('address')}
                                    errorMessage={form.errors.address}
                                    variant="bordered"
                                    size="sm"
                                    radius={themeRadius}
                                    classNames={{
                                        input: "text-small",
                                        inputWrapper: "min-h-unit-10"
                                    }}
                                    style={{
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}
                                />

                                {/* Password fields (only for new users) */}
                                {!editMode && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            label="Password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Enter password"
                                            value={form.data.password}
                                            onChange={(e) => handleChange('password', e.target.value)}
                                            onBlur={() => form.validate('password')}
                                            isInvalid={form.invalid('password')}
                                            errorMessage={form.errors.password}
                                            isRequired={!editMode}
                                            variant="bordered"
                                            size="sm"
                                            radius={themeRadius}
                                            endContent={
                                                <button
                                                    className="focus:outline-none"
                                                    type="button"
                                                    onClick={handleTogglePasswordVisibility}
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="w-4 h-4 text-default-400" />
                                                    ) : (
                                                        <Eye className="w-4 h-4 text-default-400" />
                                                    )}
                                                </button>
                                            }
                                            classNames={{
                                                input: "text-small",
                                                inputWrapper: "min-h-unit-10"
                                            }}
                                            style={{
                                                fontFamily: `var(--fontFamily, "Inter")`,
                                            }}
                                        />

                                        <Input
                                            label="Confirm Password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Confirm password"
                                            value={form.data.password_confirmation}
                                            onChange={(e) => handleChange('password_confirmation', e.target.value)}
                                            onBlur={() => form.validate('password_confirmation')}
                                            isInvalid={form.invalid('password_confirmation') || (form.data.password !== form.data.password_confirmation && form.data.password_confirmation)}
                                            errorMessage={form.errors.password_confirmation || (form.data.password !== form.data.password_confirmation && form.data.password_confirmation ? 'Passwords do not match' : '')}
                                            isRequired={!editMode}
                                            variant="bordered"
                                            size="sm"
                                            radius={themeRadius}
                                            endContent={
                                                <button
                                                    className="focus:outline-none"
                                                    type="button"
                                                    onClick={handleTogglePasswordVisibility}
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="w-4 h-4 text-default-400" />
                                                    ) : (
                                                        <Eye className="w-4 h-4 text-default-400" />
                                                    )}
                                                </button>
                                            }
                                            classNames={{
                                                input: "text-small",
                                                inputWrapper: "min-h-unit-10"
                                            }}
                                            style={{
                                                fontFamily: `var(--fontFamily, "Inter")`,
                                            }}
                                        />
                                    </div>
                                )}
                            </form>
                        </ModalBody>
                        
                        <ModalFooter className="flex justify-between px-4 sm:px-6 py-3 sm:py-4" style={{
                            borderColor: `var(--theme-divider, #E4E4E7)`,
                            fontFamily: `var(--fontFamily, "Inter")`,
                        }}>
                            <Button 
                                variant="light" 
                                onPress={closeModal}
                                isDisabled={form.processing}
                                radius={themeRadius}
                                style={{
                                    borderRadius: `var(--borderRadius, 8px)`,
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}
                            >
                                Cancel
                            </Button>
                            
                            <Button
                                variant="solid"
                                color="primary"
                                onPress={handleSubmit}
                                isLoading={form.processing}
                                isDisabled={!form.isDirty || form.processing}
                                startContent={!form.processing && <Lock className="w-4 h-4" />}
                                radius={themeRadius}
                                style={{
                                    borderRadius: `var(--borderRadius, 8px)`,
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}
                            >
                                {editMode ? 'Update User' : 'Add User'}
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default AddEditUserForm;
