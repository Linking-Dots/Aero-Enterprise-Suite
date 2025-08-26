import {
    Button,
    Input,
    Select,
    SelectItem,
    Spinner
} from "@heroui/react";
import React, {useEffect, useState} from "react";
import { X } from 'lucide-react';
import GlassDialog from "@/Components/GlassDialog.jsx";
import useTheme from "@/theme";
import {toast} from "react-toastify";

const PersonalInformationForm = ({user,setUser, open, closeModal }) => {
    const [initialUserData, setInitialUserData] = useState({
        id: user.id,
        passport_no: user.passport_no || '',
        passport_exp_date: user.passport_exp_date || '',
        nationality: user.nationality || '',
        religion: user.religion || '',
        marital_status: user.marital_status || '',
        employment_of_spouse: user.employment_of_spouse || '',
        number_of_children: user.number_of_children || '', // Assuming number_of_children should default to 0 if not provided
        nid: user.nid || '' // Default to empty string if nid is not provided
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

            // Special case handling
            if (key === 'marital_status' && value === 'Single') {
                updatedData['employment_of_spouse'] = '';
                updatedData['number_of_children'] = '';
            }

            return updatedData;
        });

        setChangedUserData((prevUser) => {
            const updatedData = { ...prevUser, [key]: value };

            // Remove the key if the value is an empty string
            if (value === '') {
                delete updatedData[key];
            }

            // Special case handling
            if (key === 'marital_status' && value === 'Single') {
                updatedData['employment_of_spouse'] = null;
                updatedData['number_of_children'] = null;
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
                ruleSet: 'personal',
                ...initialUserData,
            });

            if (response.status === 200) {
                setUser(response.data.user);
                toast.success(response.data.messages?.length > 0 ? response.data.messages.join(' ') : 'Personal information updated successfully', {
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
                    toast.error(error.response.data.error || 'Failed to update personal information.', {
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Personal Information</h3>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Input
                                label="Passport No"
                                value={changedUserData.passport_no || initialUserData.passport_no || ''}
                                onChange={(e) => handleChange('passport_no', e.target.value)}
                                isInvalid={Boolean(errors.passport_no)}
                                errorMessage={errors.passport_no}
                            />
                        </div>
                        <div>
                            <Input
                                label="Passport Expiry Date"
                                type="date"
                                value={changedUserData.passport_exp_date || initialUserData.passport_exp_date || ''}
                                onChange={(e) => handleChange('passport_exp_date', e.target.value)}
                                isInvalid={Boolean(errors.passport_exp_date)}
                                errorMessage={errors.passport_exp_date}
                            />
                        </div>
                        <div>
                            <Input
                                label="NID No"
                                value={changedUserData.nid || initialUserData.nid || ''}
                                onChange={(e) => handleChange('nid', e.target.value)}
                                isInvalid={Boolean(errors.nid)}
                                errorMessage={errors.nid}
                            />
                        </div>
                        <div>
                            <Input
                                label="Nationality"
                                value={changedUserData.nationality || initialUserData.nationality || ''}
                                onChange={(e) => handleChange('nationality', e.target.value)}
                                isInvalid={Boolean(errors.nationality)}
                                errorMessage={errors.nationality}
                            />
                        </div>
                        <div>
                            <Input
                                label="Religion"
                                value={changedUserData.religion || initialUserData.religion || ''}
                                onChange={(e) => handleChange('religion', e.target.value)}
                                isInvalid={Boolean(errors.religion)}
                                errorMessage={errors.religion}
                            />
                        </div>
                        <div>
                            <Select
                                label="Marital Status"
                                selectedKeys={changedUserData.marital_status || initialUserData.marital_status ? [changedUserData.marital_status || initialUserData.marital_status] : []}
                                onSelectionChange={(keys) => handleChange('marital_status', Array.from(keys)[0])}
                                isInvalid={Boolean(errors.marital_status)}
                                errorMessage={errors.marital_status}
                            >
                                <SelectItem key="na" value="na">-</SelectItem>
                                <SelectItem key="Single" value="Single">Single</SelectItem>
                                <SelectItem key="Married" value="Married">Married</SelectItem>
                            </Select>
                        </div>
                        <div>
                            <Input
                                label="Employment of spouse"
                                value={changedUserData.marital_status === 'Single' ? '' : changedUserData.employment_of_spouse || initialUserData.employment_of_spouse}
                                onChange={(e) => handleChange('employment_of_spouse', e.target.value)}
                                isInvalid={Boolean(errors.employment_of_spouse)}
                                errorMessage={errors.employment_of_spouse}
                                isDisabled={changedUserData.marital_status === 'Single' || initialUserData.marital_status === 'Single'}
                            />
                        </div>
                        <div>
                            <Input
                                label="No. of children"
                                type="number"
                                value={changedUserData.marital_status === 'Single' ? '' : changedUserData.number_of_children || initialUserData.number_of_children}
                                onChange={(e) => handleChange('number_of_children', e.target.value)}
                                isInvalid={Boolean(errors.number_of_children)}
                                errorMessage={errors.number_of_children}
                                isDisabled={changedUserData.marital_status === 'Single' || initialUserData.marital_status === 'Single'}
                            />
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

export default PersonalInformationForm;
