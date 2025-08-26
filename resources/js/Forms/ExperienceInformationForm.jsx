import React, {useState} from 'react';
import {
    Button,
    Input,
    Spinner
} from '@heroui/react';
import { Plus, X } from 'lucide-react';
import GlassCard from '@/Components/GlassCard'; // Ensure this component is correctly imported
import GlassDialog from '@/Components/GlassDialog.jsx'; // Ensure this component is correctly imported
import useTheme from '@/theme';
import {toast} from 'react-toastify';

const ExperienceInformationForm = ({ user, open, closeModal, setUser }) => {
    const [updatedUser, setUpdatedUser] = useState({
        id: user.id
    });
    const [dataChanged, setDataChanged] = useState(false);
    const [experienceList, setExperienceList] = useState(user.experiences.length > 0 ? user.experiences : [{ company_name: "", location: "", job_position: "", period_from: "", period_to: "", description: "" }]);
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);
    const theme = useTheme();

    const handleExperienceChange = (index, field, value) => {
        const updatedList = [...experienceList];
        updatedList[index] = { ...updatedList[index], [field]: value };
        setExperienceList(updatedList);

        const changedExperiences = updatedList.filter((entry, i) => {
            const originalEntry = user.experiences[i] || {};
            const hasChanged = (
                !originalEntry.id ||
                entry.company_name !== originalEntry.company_name ||
                entry.location !== originalEntry.location ||
                entry.job_position !== originalEntry.job_position ||
                entry.period_from !== originalEntry.period_from ||
                entry.period_to !== originalEntry.period_to ||
                entry.description !== originalEntry.description
            );

            // If reverted to the original value, remove it from the list of changes
            const hasReverted = (
                originalEntry.id &&
                entry.company_name === originalEntry.company_name &&
                entry.location === originalEntry.location &&
                entry.job_position === originalEntry.job_position &&
                entry.period_from === originalEntry.period_from &&
                entry.period_to === originalEntry.period_to &&
                entry.description === originalEntry.description
            );

            return hasChanged && !hasReverted;
        });

        setUpdatedUser(prevUser => ({
            ...prevUser,
            experiences: [...changedExperiences],
        }));
        const hasChanges = changedExperiences.length > 0;
        setDataChanged(hasChanges);
    };


    const handleExperienceRemove = async (index) => {
        const removedExperience = experienceList[index];
        const updatedList = experienceList.filter((_, i) => i !== index);
            setExperienceList(updatedList.length > 0 ? updatedList : [{ company_name: "", location: "", job_position: "", period_from: "", period_to: "", description: "" }]);

        if (removedExperience.id) {
            const promise = new Promise(async (resolve, reject) => {
                try {
                    const response = await fetch('/experience/delete', {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.head.querySelector('meta[name="csrf-token"]').content,
                        },
                        body: JSON.stringify({ id: removedExperience.id, user_id: user.id }),
                    });

                    const data = await response.json();

                    if (response.ok) {
                        // Update the user state with the returned experiences from the server
                        setUpdatedUser(prevUser => ({
                            ...prevUser,
                            experiences: data.experiences,
                        }));

                        setUser(prevUser => ({
                            ...prevUser,
                            experiences: data.experiences,
                        }));

                        resolve(data.message || 'Experience record deleted successfully.');
                        closeModal();
                    } else {
                        setErrors([...data.errors]);
                        reject(data.error || 'Failed to delete experience record.');
                    }
                } catch (error) {
                    reject(error);
                }
            });

            toast.promise(
                promise,
                {
                    pending: {
                        render() {
                            return (
                                <div className="flex items-center">
                                    <Spinner size="sm" />
                                    <span className="ml-2">Deleting experience record ...</span>
                                </div>
                            );
                        },
                        icon: false,
                        style: {
                            backdropFilter: 'blur(16px) saturate(200%)',
                            background: theme.glassCard.background,
                            border: theme.glassCard.border,
                            color: theme.palette.text.primary
                        }
                    },
                    success: {
                        render({ data }) {
                            return <>{data}</>;
                        },
                        icon: '🟢',
                        style: {
                            backdropFilter: 'blur(16px) saturate(200%)',
                            background: theme.glassCard.background,
                            border: theme.glassCard.border,
                            color: theme.palette.text.primary
                        }
                    },
                    error: {
                        render({ data }) {
                            return <>{data}</>;
                        },
                        icon: '🔴',
                        style: {
                            backdropFilter: 'blur(16px) saturate(200%)',
                            background: theme.glassCard.background,
                            border: theme.glassCard.border,
                            color: theme.palette.text.primary
                        }
                    }
                }
            );
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setProcessing(true);

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await fetch('/experience/update', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.head.querySelector('meta[name="csrf-token"]').content,
                    },
                    body: JSON.stringify({ experiences: experienceList.map(entry => ({ ...entry, user_id: user.id })) }),
                });

                const data = await response.json();

                if (response.ok) {
                    setUser(prevUser => ({
                        ...prevUser,
                        experiences: data.experiences,
                    }));
                    setProcessing(false);
                    closeModal();
                    resolve([...data.messages]);
                } else {
                    setProcessing(false);
                    setErrors(data.errors);
                    console.error(data.errors);
                    reject(data.error || 'Failed to update experience records.');
                }
            } catch (error) {
                setProcessing(false);
                reject(error.message || 'An unexpected error occurred while updating experience records.');
            }
        });

        toast.promise(
            promise,
            {
                pending: {
                    render() {
                        return (
                            <div className="flex items-center">
                                <Spinner size="sm" />
                                <span className="ml-2">Updating experience records ...</span>
                            </div>
                        );
                    },
                    icon: false,
                    style: {
                        backdropFilter: 'blur(16px) saturate(200%)',
                        background: theme.glassCard.background,
                        border: theme.glassCard.border,
                        color: theme.palette.text.primary
                    }
                },
                success: {
                    render({ data }) {
                        return (
                            <>
                                {data.map((message, index) => (
                                    <div key={index}>{message}</div>
                                ))}
                            </>
                        );
                    },
                    icon: '🟢',
                    style: {
                        backdropFilter: 'blur(16px) saturate(200%)',
                        background: theme.glassCard.background,
                        border: theme.glassCard.border,
                        color: theme.palette.text.primary,
                    },
                },
                error: {
                    render({ data }) {
                        return <>{data}</>;
                    },
                    icon: '🔴',
                    style: {
                        backdropFilter: 'blur(16px) saturate(200%)',
                        background: theme.glassCard.background,
                        border: theme.glassCard.border,
                        color: theme.palette.text.primary
                    }
                }
            }
        );
    };

    const handleAddMore = async () => {
        setExperienceList([...experienceList, { company: "", role: "", start_date: "", end_date: "", responsibilities: "" }]);
    };

    return (
        <GlassDialog open={open} onClose={closeModal} maxWidth="md" fullWidth>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Experience Information</h3>
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
                    <div className="space-y-4">
                        {experienceList.map((experience, index) => (
                            <div key={index}>
                                <GlassCard>
                                    <div className="p-4 relative">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                                                Experience #{index + 1}
                                            </h4>
                                            <Button
                                                isIconOnly
                                                variant="light"
                                                onPress={() => handleExperienceRemove(index)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <X size={16} />
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Input
                                                    label="Company"
                                                    value={experience.company_name || ''}
                                                    onChange={(e) => handleExperienceChange(index, 'company_name', e.target.value)}
                                                    isInvalid={Boolean(errors[`experiences.${index}.company_name`])}
                                                    errorMessage={errors[`experiences.${index}.company_name`] ? errors[`experiences.${index}.company_name`][0] : ''}
                                                />
                                            </div>
                                            <div>
                                                <Input
                                                    label="Location"
                                                    value={experience.location || ''}
                                                    onChange={(e) => handleExperienceChange(index, 'location', e.target.value)}
                                                    isInvalid={Boolean(errors[`experiences.${index}.location`])}
                                                    errorMessage={errors[`experiences.${index}.location`] ? errors[`experiences.${index}.location`][0] : ''}
                                                />
                                            </div>
                                            <div>
                                                <Input
                                                    label="Role"
                                                    value={experience.job_position || ''}
                                                    onChange={(e) => handleExperienceChange(index, 'job_position', e.target.value)}
                                                    isInvalid={Boolean(errors[`experiences.${index}.job_position`])}
                                                    errorMessage={errors[`experiences.${index}.job_position`] ? errors[`experiences.${index}.job_position`][0] : ''}
                                                />
                                            </div>
                                            <div>
                                                <Input
                                                    label="Started From"
                                                    type="date"
                                                    value={experience.period_from || ''}
                                                    onChange={(e) => handleExperienceChange(index, 'period_from', e.target.value)}
                                                    isInvalid={Boolean(errors[`experiences.${index}.period_from`])}
                                                    errorMessage={errors[`experiences.${index}.period_from`] ? errors[`experiences.${index}.period_from`][0] : ''}
                                                />
                                            </div>
                                            <div>
                                                <Input
                                                    label="Ended On"
                                                    type="date"
                                                    value={experience.period_to || ''}
                                                    onChange={(e) => handleExperienceChange(index, 'period_to', e.target.value)}
                                                    isInvalid={Boolean(errors[`experiences.${index}.period_to`])}
                                                    errorMessage={errors[`experiences.${index}.period_to`] ? errors[`experiences.${index}.period_to`][0] : ''}
                                                />
                                            </div>
                                            <div className="col-span-full">
                                                <Input
                                                    label="Responsibilities"
                                                    value={experience.description || ''}
                                                    onChange={(e) => handleExperienceChange(index, 'description', e.target.value)}
                                                    isInvalid={Boolean(errors[`experiences.${index}.description`])}
                                                    errorMessage={errors[`experiences.${index}.description`] ? errors[`experiences.${index}.description`][0] : ''}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </GlassCard>
                            </div>
                        ))}
                        <Button 
                            size="sm" 
                            color="danger" 
                            variant="bordered"
                            onPress={handleAddMore}
                            startContent={<Plus size={16} />}
                        >
                            Add More
                        </Button>
                    </div>
                </div>
                <div className="flex items-center justify-center p-6 border-t border-gray-200 dark:border-gray-700">
                    <Button
                        isDisabled={!dataChanged}
                        className="rounded-full px-8"
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

export default ExperienceInformationForm;
