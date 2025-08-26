import {
    Avatar,
    Button,
    Input,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Select,
    SelectItem,
    Spinner
} from "@heroui/react";
import React, {useEffect, useState} from "react";
import { X, Camera } from 'lucide-react';
import GlassDialog from "@/Components/GlassDialog.jsx";
import useTheme, { alpha } from "@/theme";
import {toast} from "react-toastify";

const ProfileForm = ({user, allUsers, departments, designations,setUser, open, closeModal }) => {

    const [initialUserData, setInitialUserData] = useState({
        id: user.id,
        name: user.name || '',
        gender: user.gender || '',
        birthday: user.birthday || '',
        date_of_joining: user.date_of_joining || '',
        address: user.address || '',
        employee_id: user.employee_id || '',
        phone: user.phone || '',
        email: user.email || '',
        department: user.department || '',
        designation: user.designation || '',
        report_to: user.report_to || '',
    });


    const [changedUserData, setChangedUserData] = useState({
        id: user.id,
    });

    const [dataChanged, setDataChanged] = useState(false);


    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);
    const [hover, setHover] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [allDesignations, setAllDesignations] = useState(designations);
    const [allReportTo, setAllReportTo] = useState(allUsers);

    const theme = useTheme();

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Create an object URL for preview
            const objectURL = URL.createObjectURL(file);

            // Update state with the selected file's URL for preview
            setSelectedImage(objectURL);

            const promise = new Promise(async (resolve, reject) => {
                try {
                    const formData = new FormData();
                    formData.append('id', user.id);

                    // Append the selected image if there is one
                    if (file) {
                        // Get the file type
                        const fileType = file.type;

                        // Check if the file type is valid
                        if (['image/jpeg', 'image/jpg', 'image/png'].includes(fileType)) {
                            formData.append('profile_image', file);
                        } else {
                            console.error('Invalid file type. Only JPEG and PNG are allowed.');
                            reject('Invalid file type');
                            return;
                        }
                    }

                    const response = await fetch(route('profile.update'), {
                        method: 'POST',
                        headers: {
                            'X-CSRF-TOKEN': document.head.querySelector('meta[name="csrf-token"]').content,
                        },
                        body: formData,
                    });

                    const data = await response.json();

                    if (response.ok) {
                        setUser(data.user);
                        setProcessing(false);
                        resolve([...data.messages]);
                    } else {
                        setProcessing(false);
                        setErrors(data.errors);
                        reject(data.error || 'Failed to update profile image.');
                        console.error(data.errors);
                    }
                } catch (error) {
                    setProcessing(false);
                    console.error(error);
                    reject(error.message || 'An unexpected error occurred.');
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
                                    <span className="ml-2">Updating profile image...</span>
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
                            color: theme.palette.text.primary
                        }
                    },
                    error: {
                        render({ data }) {
                            return (
                                <>
                                    {data}
                                </>
                            );
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


        // Special case handling
        if (user.department !== initialUserData.department) {
            // Reset designation and report_to if department changes
            initialUserData.designation = null;
            initialUserData.report_to = null;
        }

        // Update designations based on the current department or the initial department
        setAllDesignations(
            designations.filter((designation) =>
                designation.department_id === (changedUserData.department || initialUserData.department)
            )
        );

        setAllReportTo(
            allUsers.filter((user) =>
                user.department === (changedUserData.department || initialUserData.department)
            )
        );

        // Function to filter out unchanged data from changedUserData
        const updatedChangedUserData = { ...changedUserData };
        for (const key in updatedChangedUserData) {
            // Skip comparison for 'id' or if the value matches the original data
            if (key !== 'id' && updatedChangedUserData[key] === user[key]) {
                delete updatedChangedUserData[key]; // Remove unchanged data
            }
        }

        // Determine if there are any changes excluding 'id'
        const hasChanges = Object.keys(updatedChangedUserData).length > 1;

        setDataChanged(hasChanges);

    }, [initialUserData, changedUserData]);


    const handleSubmit = async (event) => {
        event.preventDefault();
        setProcessing(true);

        try {
            const response = await axios.post(route('profile.update'), {
                ruleSet: 'profile',
                ...initialUserData,
            });

            if (response.status === 200) {
                setUser(response.data.user);
                toast.success(response.data.messages?.length > 0 ? response.data.messages.join(' ') : 'Profile information updated successfully', {
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
                    toast.error(error.response.data.error || 'Failed to update profile information.', {
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
        <GlassDialog
            open={open}
            onClose={closeModal}
        >
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Information</h3>
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
                        <div className="col-span-full flex items-center justify-center">
                            <div
                                className="relative inline-block"
                                onMouseEnter={() => setHover(true)}
                                onMouseLeave={() => setHover(false)}
                            >
                                <Avatar
                                    src={selectedImage || user.profile_image}
                                    alt={changedUserData.name || initialUserData.name}
                                    className="w-24 h-24"
                                />
                                {hover && (
                                    <>
                                        <div
                                            className="absolute top-0 left-0 w-full h-full rounded-full flex justify-center items-center cursor-pointer"
                                            style={{
                                                backgroundColor: alpha(theme.colors.black, 0.5),
                                            }}
                                        >
                                            <Button
                                                isIconOnly
                                                variant="light"
                                                className="text-white"
                                            >
                                                <Camera size={20} />
                                            </Button>
                                        </div>
                                    </>
                                )}
                                <input
                                    accept="image/*"
                                    style={{display: 'none'}}
                                    id="upload-button"
                                    type="file"
                                    onChange={handleImageChange}
                                />
                                <label htmlFor="upload-button">
                                    <div
                                        className="absolute w-full h-full top-0 left-0 rounded-full cursor-pointer"
                                    />
                                </label>
                            </div>

                        </div>
                        <div>
                            <Input
                                label="Name"
                                value={changedUserData.name || initialUserData.name || ''}
                                onChange={(e) => handleChange('name', e.target.value)}
                                isInvalid={Boolean(errors.name)}
                                errorMessage={errors.name}
                            />
                        </div>
                        <div>
                            <Select
                                label="Gender"
                                selectedKeys={changedUserData.gender || initialUserData.gender ? [changedUserData.gender || initialUserData.gender] : []}
                                onSelectionChange={(keys) => handleChange('gender', Array.from(keys)[0])}
                                isInvalid={Boolean(errors.gender)}
                                errorMessage={errors.gender}
                            >
                                <SelectItem key="Male" value="Male">Male</SelectItem>
                                <SelectItem key="Female" value="Female">Female</SelectItem>
                            </Select>
                        </div>
                        <div>
                            <Input
                                label="Birth Date"
                                type="date"
                                value={changedUserData.birthday || initialUserData.birthday || ''}
                                onChange={(e) => handleChange('birthday', e.target.value)}
                                isInvalid={Boolean(errors.birthday)}
                                errorMessage={errors.birthday}
                            />
                        </div>
                        <div>
                            <Input
                                label="Joining Date"
                                type="date"
                                value={changedUserData.date_of_joining || initialUserData.date_of_joining || ''}
                                onChange={(e) => handleChange('date_of_joining', e.target.value)}
                                isInvalid={Boolean(errors.date_of_joining)}
                                errorMessage={errors.date_of_joining}
                            />
                        </div>

                        <div className="col-span-full">
                            <Input
                                label="Address"
                                value={changedUserData.address || initialUserData.address}
                                onChange={(e) => handleChange('address', e.target.value)}
                                isInvalid={Boolean(errors.address)}
                                errorMessage={errors.address}
                            />
                        </div>
                        <div>
                            <Input
                                label="Employee ID"
                                value={changedUserData.employee_id || initialUserData.employee_id || ''}
                                onChange={(e) => handleChange('employee_id', e.target.value)}
                                isInvalid={Boolean(errors.employee_id)}
                                errorMessage={errors.employee_id}
                            />
                        </div>
                        <div>
                            <Input
                                label="Phone Number"
                                value={changedUserData.phone || initialUserData.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                isInvalid={Boolean(errors.phone)}
                                errorMessage={errors.phone}
                            />
                        </div>
                        <div>
                            <Input
                                label="Email Address"
                                value={changedUserData.email || initialUserData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                isInvalid={Boolean(errors.email)}
                                errorMessage={errors.email}
                            />
                        </div>
                        <div>
                            <Select
                                label="Department"
                                selectedKeys={changedUserData.department || initialUserData.department ? [String(changedUserData.department || initialUserData.department)] : []}
                                onSelectionChange={(keys) => handleChange('department', Array.from(keys)[0])}
                                isInvalid={Boolean(errors.department)}
                                errorMessage={errors.department}
                            >
                                {departments.map((dept) => (
                                    <SelectItem key={dept.id} value={dept.id}>
                                        {dept.name}
                                    </SelectItem>
                                ))}
                            </Select>
                        </div>
                        <div>
                            <Select
                                label="Designation"
                                selectedKeys={changedUserData.designation || initialUserData.designation ? [String(changedUserData.designation || initialUserData.designation)] : []}
                                onSelectionChange={(keys) => handleChange('designation', Array.from(keys)[0])}
                                isInvalid={Boolean(errors.designation)}
                                errorMessage={errors.designation}
                                isDisabled={!user.department}
                            >
                                {allDesignations.map((desig) => (
                                    <SelectItem key={desig.id} value={desig.id}>
                                        {desig.title}
                                    </SelectItem>
                                ))}
                            </Select>
                        </div>
                        <div>
                            <Select
                                label="Reports To"
                                selectedKeys={changedUserData.report_to || initialUserData.report_to ? [String(changedUserData.report_to || initialUserData.report_to)] : []}
                                onSelectionChange={(keys) => handleChange('report_to', Array.from(keys)[0])}
                                isInvalid={Boolean(errors.report_to)}
                                errorMessage={errors.report_to}
                                isDisabled={user.report_to === 'na'}
                            >
                                <SelectItem key="na" value="na">--</SelectItem>
                                {allReportTo.map((pers) => (
                                    <SelectItem key={pers.id} value={pers.id}>
                                        {pers.name}
                                    </SelectItem>
                                ))}
                            </Select>
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


    )
        ;
};

export default ProfileForm;
