import React, {useEffect, useState} from "react";
import {
    Button,
    Input,
    Spinner,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from "@heroui/react";
import { X } from "lucide-react";
import useTheme from "@/theme";
import {toast} from "react-toastify";
import GlassDialog from "@/Components/GlassDialog.jsx";

const FamilyMemberForm = ({ user, open, closeModal, handleDelete, setUser }) => {
    const [initialUserData, setInitialUserData] = useState({
        id: user.id,
        family_member_name: user.family_member_name || '',
        family_member_relationship: user.family_member_relationship || '',
        family_member_dob: user.family_member_dob || '', // Assuming date format is in string format
        family_member_phone: user.family_member_phone || '',
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
                ruleSet: 'family',
                ...initialUserData,
            });

            if (response.status === 200) {
                setUser(response.data.user);
                toast.success(response.data.messages?.length > 0 ? response.data.messages.join(' ') : 'Family information updated successfully', {
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
                    toast.error(error.response.data.error || 'Failed to update family information.', {
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
            <ModalContent>
                <ModalHeader className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Family Member</h2>
                    <Button
                        isIconOnly
                        variant="light"
                        onPress={closeModal}
                        className="absolute top-2 right-2"
                    >
                        <X size={20} />
                    </Button>
                </ModalHeader>
            <form onSubmit={handleSubmit}>
                <ModalBody>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-1">
                            <Input
                                label="Name"
                                variant="bordered"
                                value={changedUserData.family_member_name || initialUserData.family_member_name || ""}
                                onChange={(e) => handleChange('family_member_name', e.target.value)}
                                isInvalid={Boolean(errors.family_member_name)}
                                errorMessage={errors.family_member_name}
                            />
                        </div>
                        <div className="col-span-1">
                            <Input
                                label="Relationship"
                                variant="bordered"
                                value={changedUserData.family_member_relationship || initialUserData.family_member_relationship || ""}
                                onChange={(e) => handleChange('family_member_relationship', e.target.value)}
                                isInvalid={Boolean(errors.family_member_relationship)}
                                errorMessage={errors.family_member_relationship}
                            />
                        </div>
                        <div className="col-span-1">
                            <Input
                                label="Date of Birth"
                                variant="bordered"
                                type="date"
                                value={changedUserData.family_member_dob || initialUserData.family_member_dob || ""}
                                onChange={(e) => handleChange('family_member_dob', e.target.value)}
                                isInvalid={Boolean(errors.family_member_dob)}
                                errorMessage={errors.family_member_dob}
                            />
                        </div>
                        <div className="col-span-1">
                            <Input
                                label="Phone"
                                variant="bordered"
                                value={changedUserData.family_member_phone || initialUserData.family_member_phone || ""}
                                onChange={(e) => handleChange('family_member_phone', e.target.value)}
                                isInvalid={Boolean(errors.family_member_phone)}
                                errorMessage={errors.family_member_phone}
                            />
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter className="flex justify-end gap-2">
                    <Button
                        isDisabled={!dataChanged}
                        variant="bordered"
                        color="primary"
                        type="submit"
                        isLoading={processing}
                        className="rounded-full px-4 py-2"
                    >
                        Submit
                    </Button>
                </ModalFooter>
            </form>
            </ModalContent>
        </GlassDialog>
    );
};

export default FamilyMemberForm;
