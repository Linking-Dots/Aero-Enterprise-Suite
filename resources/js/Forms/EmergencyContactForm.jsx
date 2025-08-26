import {
    Button,
    Input,
    Spinner
} from "@heroui/react";
import React, {useEffect, useState} from "react";
import GlassCard from "@/Components/GlassCard.jsx";
import { X } from 'lucide-react';
import GlassDialog from "@/Components/GlassDialog.jsx";
import useTheme from '@/theme';
import {toast} from "react-toastify";

const EmergencyContactForm = ({user,setUser, open, closeModal }) => {
    const [initialUserData, setInitialUserData] = useState({
        id: user.id,
        emergency_contact_primary_name: user.emergency_contact_primary_name || '',
        emergency_contact_primary_relationship: user.emergency_contact_primary_relationship || '',
        emergency_contact_primary_phone: user.emergency_contact_primary_phone || '',
        emergency_contact_secondary_name: user.emergency_contact_secondary_name || '',
        emergency_contact_secondary_relationship: user.emergency_contact_secondary_relationship || '',
        emergency_contact_secondary_phone: user.emergency_contact_secondary_phone || ''
    });

    const [changedUserData, setChangedUserData] = useState({
        id: user.id,
    });

    const [dataChanged, setDataChanged] = useState(false);


    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

    const theme = useTheme();
    const handleChange = (key, value) => {
        setInitialUserData((prevUser) => {
            const updatedData = { ...prevUser, [key]: value };

            // Remove the key if the value is an empty string
            if (value === '') {
                delete updatedData[key];
            }

            return updatedData;
        });

        setChangedUserData((prevUser) => {
            const updatedData = { ...prevUser, [key]: value };

            // Remove the key if the value is an empty string
            if (value === '') {
                delete updatedData[key];
            }

            return updatedData;
        });
    };

    useEffect(() => {
        // Function to filter out unchanged data from changedUserData
        for (const key in changedUserData) {
            // Skip comparison for 'id' or if the value matches the original data
            if (key !== 'id' && changedUserData[key] === user[key]) {
                delete changedUserData[key]; // Skip this iteration
            }
        }
        const hasChanges = Object.keys(changedUserData).filter(key => key !== 'id').length > 0;

        setDataChanged(hasChanges);

    }, [initialUserData, changedUserData, user]);



    const handleSubmit = async (event) => {
        event.preventDefault();
        setProcessing(true);

        try {
            const response = await axios.post(route('profile.update'), {
                ruleSet: 'emergency',
                ...initialUserData,
            });

            if (response.status === 200) {
                setUser(response.data.user);
                toast.success(response.data.messages?.length > 0 ? response.data.messages.join(' ') : 'Emergency contact updated successfully', {
                    icon: '🟢',
                    style: {
                        backdropFilter: 'blur(16px) saturate(200%)',
                        background: theme.glassCard.background,
                        border: theme.glassCard.border,
                        color: theme.palette.text.primary,
                    }
                });
                closeModal();
            }
        } catch (error) {
            setProcessing(false);

            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                if (error.response.status === 422) {
                    // Handle validation errors
                    setErrors(error.response.data.errors || {});
                    toast.error(error.response.data.error || 'Failed to update emergency contact.', {
                        icon: '🔴',
                        style: {
                            backdropFilter: 'blur(16px) saturate(200%)',
                            background: theme.glassCard.background,
                            border: theme.glassCard.border,
                            color: theme.palette.text.primary,
                        }
                    });
                } else {
                    // Handle other HTTP errors
                    toast.error('An unexpected error occurred. Please try again later.', {
                        icon: '🔴',
                        style: {
                            backdropFilter: 'blur(16px) saturate(200%)',
                            background: theme.glassCard.background,
                            border: theme.glassCard.border,
                            color: theme.palette.text.primary,
                        }
                    });
                }
                console.error(error.response.data);
            } else if (error.request) {
                // The request was made but no response was received
                toast.error('No response received from the server. Please check your internet connection.', {
                    icon: '🔴',
                    style: {
                        backdropFilter: 'blur(16px) saturate(200%)',
                        background: theme.glassCard.background,
                        border: theme.glassCard.border,
                        color: theme.palette.text.primary,
                    }
                });
                console.error(error.request);
            } else {
                // Something happened in setting up the request that triggered an Error
                toast.error('An error occurred while setting up the request.', {
                    icon: '🔴',
                    style: {
                        backdropFilter: 'blur(16px) saturate(200%)',
                        background: theme.glassCard.background,
                        border: theme.glassCard.border,
                        color: theme.palette.text.primary,
                    }
                });
                console.error('Error', error.message);
            }
        } finally {
            setProcessing(false);
        }
    };



    return (
        <GlassDialog open={open} onClose={closeModal}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Emergency Contact Information</h3>
                <Button
                    isIconOnly
                    variant="light"
                    onPress={closeModal}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                    <X size={20} />
                </Button>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="p-6">
                    <div className="space-y-6">
                        {/* Primary Contact Section */}
                        <div>
                            <GlassCard>
                                <div className="p-4">
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                        Primary Contact
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Input
                                                label="Name"
                                                isRequired
                                                value={changedUserData.emergency_contact_primary_name || initialUserData.emergency_contact_primary_name || ""}
                                                onChange={(e) => handleChange("emergency_contact_primary_name", e.target.value)}
                                                isInvalid={Boolean(errors.emergency_contact_primary_name)}
                                                errorMessage={errors.emergency_contact_primary_name}
                                            />
                                        </div>
                                        <div>
                                            <Input
                                                label="Relationship"
                                                isRequired
                                                value={changedUserData.emergency_contact_primary_relationship || initialUserData.emergency_contact_primary_relationship || ""}
                                                onChange={(e) => handleChange("emergency_contact_primary_relationship", e.target.value)}
                                                isInvalid={Boolean(errors.emergency_contact_primary_relationship)}
                                                errorMessage={errors.emergency_contact_primary_relationship}
                                            />
                                        </div>
                                        <div>
                                            <Input
                                                label="Phone"
                                                isRequired
                                                value={changedUserData.emergency_contact_primary_phone || initialUserData.emergency_contact_primary_phone || ""}
                                                onChange={(e) => handleChange("emergency_contact_primary_phone", e.target.value)}
                                                isInvalid={Boolean(errors.emergency_contact_primary_phone)}
                                                errorMessage={errors.emergency_contact_primary_phone}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>
                        </div>

                        {/* Secondary Contact Section */}
                        <div>
                            <GlassCard>
                                <div className="p-4">
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                        Secondary Contact
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Input
                                                label="Name"
                                                value={changedUserData.emergency_contact_secondary_name || initialUserData.emergency_contact_secondary_name || ""}
                                                onChange={(e) => handleChange("emergency_contact_secondary_name", e.target.value)}
                                                isInvalid={Boolean(errors.emergency_contact_secondary_name)}
                                                errorMessage={errors.emergency_contact_secondary_name}
                                            />
                                        </div>
                                        <div>
                                            <Input
                                                label="Relationship"
                                                value={changedUserData.emergency_contact_secondary_relationship || initialUserData.emergency_contact_secondary_relationship || ""}
                                                onChange={(e) => handleChange("emergency_contact_secondary_relationship", e.target.value)}
                                                isInvalid={Boolean(errors.emergency_contact_secondary_relationship)}
                                                errorMessage={errors.emergency_contact_secondary_relationship}
                                            />
                                        </div>
                                        <div>
                                            <Input
                                                label="Phone"
                                                value={changedUserData.emergency_contact_secondary_phone || initialUserData.emergency_contact_secondary_phone || ""}
                                                onChange={(e) => handleChange("emergency_contact_secondary_phone", e.target.value)}
                                                isInvalid={Boolean(errors.emergency_contact_secondary_phone)}
                                                errorMessage={errors.emergency_contact_secondary_phone}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-center p-6 border-t border-gray-200 dark:border-gray-700">
                    <Button
                        isDisabled={!dataChanged}
                        className="rounded-full px-6"
                        variant="bordered"
                        color="primary"
                        type="submit"
                        isLoading={processing}
                    >
                        Submit
                    </Button>
                </div>
            </form>
        </GlassDialog>
    );
};

export default EmergencyContactForm;






