import React, {useState} from 'react';
import {
    Button,
    Input,
    Spinner
} from '@heroui/react';
import { Plus, X } from 'lucide-react';
import GlassCard from '@/Components/GlassCard'; // Make sure this component is correctly imported
import GlassDialog from '@/Components/GlassDialog.jsx'; // Make sure this component is correctly imported
import useTheme from '@/theme';
import {toast} from 'react-toastify';

const EducationInformationDialog = ({ user, open, closeModal, setUser }) => {
    const [updatedUser, setUpdatedUser] = useState({
        id: user.id
    });
    const [dataChanged, setDataChanged] = useState(false);
    const [educationList, setEducationList] = useState(user.educations && user.educations.length > 0 ? user.educations : [{ institution: "", subject: "", degree: "", starting_date: "", complete_date: "", grade: "" }]);
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);
    const theme = useTheme();

    const handleEducationChange = (index, field, value) => {
        const updatedList = [...educationList];
        updatedList[index] = { ...updatedList[index], [field]: value };
        setEducationList(updatedList);

        const changedEducations = updatedList.filter((entry, i) => {
            const originalEntry = user.educations[i] || {};
            const hasChanged = (
                !originalEntry.id ||
                entry.institution !== originalEntry.institution ||
                entry.subject !== originalEntry.subject ||
                entry.degree !== originalEntry.degree ||
                entry.starting_date !== originalEntry.starting_date ||
                entry.complete_date !== originalEntry.complete_date ||
                entry.grade !== originalEntry.grade
            );

            // If reverted to the original value, remove it from the list of changes
            const hasReverted = (
                originalEntry.id &&
                entry.institution === originalEntry.institution &&
                entry.subject === originalEntry.subject &&
                entry.degree === originalEntry.degree &&
                entry.starting_date === originalEntry.starting_date &&
                entry.complete_date === originalEntry.complete_date &&
                entry.grade === originalEntry.grade
            );

            return hasChanged && !hasReverted;
        });

        setUpdatedUser(prevUser => ({
            ...prevUser,
            educations: [...changedEducations],
        }));

        const hasChanges = changedEducations.length > 0;
        setDataChanged(hasChanges);
    };



    const handleEducationRemove = async (index) => {
        const removedEducation = educationList[index];
        const updatedList = educationList.filter((_, i) => i !== index);
        setEducationList(updatedList.length > 0 ? updatedList : [{ institution: "", subject: "", degree: "", starting_date: "", complete_date: "", grade: "" }]);

        if (removedEducation.id) {
            const promise = new Promise(async (resolve, reject) => {
                try {
                    const response = await fetch('/education/delete', {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.head.querySelector('meta[name="csrf-token"]').content,
                        },
                        body: JSON.stringify({ id: removedEducation.id, user_id: user.id }),
                    });

                    const data = await response.json();

                    if (response.ok) {
                        // Update the user state with the returned educations from the server
                        setUpdatedUser(prevUser => ({
                            ...prevUser,
                            educations: data.educations,
                        }));

                        setUser(prevUser => ({
                            ...prevUser,
                            educations: data.educations,
                        }));

                        // Resolve with the message returned from the server
                        resolve(data.message || 'Education record deleted successfully.');
                    } else {
                        setErrors(data.errors);
                        console.error(data.errors);
                        reject(data.error || 'Failed to delete education record.');
                    }
                } catch (error) {
                    // Reject with a generic error message
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
                                    <span className="ml-2">Deleting education record ...</span>
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
                const response = await fetch('/education/update', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.head.querySelector('meta[name="csrf-token"]').content,
                    },
                    body: JSON.stringify({ educations: educationList.map(entry => ({ ...entry, user_id: user.id })) }),
                });

                const data = await response.json();

                if (response.ok) {
                    // Update the user state with the returned educations from the server
                    setUser(prevUser => ({
                        ...prevUser,
                        educations: data.educations,
                    }));
                    setProcessing(false);
                    closeModal();
                    resolve([...data.messages]);
                } else {
                    setProcessing(false);
                    setErrors(data.errors);
                    console.error(data.errors);
                    reject(data.error || 'Failed to update education records.');
                }
            } catch (error) {
                setProcessing(false);
                reject(error.message || 'An unexpected error occurred while updating education records.');
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
                                <span className="ml-2">Updating education records ...</span>
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
        setEducationList([...educationList, { institution: "", subject: "", degree: "", starting_date: "", complete_date: "", grade: "" }]);
    };

    return (
        <GlassDialog open={open} onClose={closeModal} maxWidth="md" fullWidth>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Education Information</h3>
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
                        {educationList.map((education, index) => (
                            <div key={index}>
                                <GlassCard>
                                    <div className="p-4 relative">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                                                Education #{index + 1}
                                            </h4>
                                            <Button
                                                isIconOnly
                                                variant="light"
                                                onPress={() => handleEducationRemove(index)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <X size={16} />
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Input
                                                    label="Institution"
                                                    value={education.institution || ''}
                                                    onChange={(e) => handleEducationChange(index, 'institution', e.target.value)}
                                                    isInvalid={Boolean(errors[`educations.${index}.institution`])}
                                                    errorMessage={errors[`educations.${index}.institution`] ? errors[`educations.${index}.institution`][0] : ''}
                                                />
                                            </div>
                                            <div>
                                                <Input
                                                    label="Degree"
                                                    value={education.degree || ''}
                                                    onChange={(e) => handleEducationChange(index, 'degree', e.target.value)}
                                                    isInvalid={Boolean(errors[`educations.${index}.degree`])}
                                                    errorMessage={errors[`educations.${index}.degree`] ? errors[`educations.${index}.degree`][0] : ''}
                                                />
                                            </div>
                                            <div>
                                                <Input
                                                    label="Subject"
                                                    value={education.subject || ''}
                                                    onChange={(e) => handleEducationChange(index, 'subject', e.target.value)}
                                                    isInvalid={Boolean(errors[`educations.${index}.subject`])}
                                                    errorMessage={errors[`educations.${index}.subject`] ? errors[`educations.${index}.subject`][0] : ''}
                                                />
                                            </div>
                                            <div>
                                                <Input
                                                    label="Started in"
                                                    type="month"
                                                    value={education.starting_date || ''}
                                                    onChange={(e) => handleEducationChange(index, 'starting_date', e.target.value)}
                                                    isInvalid={Boolean(errors[`educations.${index}.starting_date`])}
                                                    errorMessage={errors[`educations.${index}.starting_date`] ? errors[`educations.${index}.starting_date`][0] : ''}
                                                />
                                            </div>
                                            <div>
                                                <Input
                                                    label="Completed in"
                                                    type="month"
                                                    value={education.complete_date || ''}
                                                    onChange={(e) => handleEducationChange(index, 'complete_date', e.target.value)}
                                                    isInvalid={Boolean(errors[`educations.${index}.complete_date`])}
                                                    errorMessage={errors[`educations.${index}.complete_date`] ? errors[`educations.${index}.complete_date`][0] : ''}
                                                />
                                            </div>
                                            <div>
                                                <Input
                                                    label="Grade"
                                                    value={education.grade || ''}
                                                    onChange={(e) => handleEducationChange(index, 'grade', e.target.value)}
                                                    isInvalid={Boolean(errors[`educations.${index}.grade`])}
                                                    errorMessage={errors[`educations.${index}.grade`] ? errors[`educations.${index}.grade`][0] : ''}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </GlassCard>
                            </div>
                        ))}
                        <div className="mt-4">
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

export default EducationInformationDialog;
