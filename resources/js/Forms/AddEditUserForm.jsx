import {
    Avatar,
    Button,
    Spinner,
    Select,
    SelectItem,
    Input
} from "@heroui/react";
import React, { useEffect, useState } from "react";
import { X, Camera, Eye, EyeOff, Lock } from 'lucide-react';
import GlassDialog from "@/Components/GlassDialog.jsx";
import { useForm } from 'laravel-precognition-react';
import { toast } from "react-toastify";

const AddEditUserForm = ({user, allUsers, departments, designations, setUsers, open, closeModal, editMode = false }) => {
    
    const [showPassword, setShowPassword] = useState(false);
    const [hover, setHover] = useState(false);
    const [selectedImage, setSelectedImage] = useState(user?.profile_image_url || user?.profile_image || null);
    const [selectedImageFile, setSelectedImageFile] = useState(null);
    const [allReportTo, setAllReportTo] = useState(allUsers);

    // Initialize Precognition form with proper method and URL
    const form = useForm(
        editMode ? 'put' : 'post',
        editMode ? route('users.update', { user: user.id }) : route('users.store'),
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
                    icon: '🔴',
                    style: {
                        backdropFilter: 'blur(16px) saturate(200%)',
                        background: theme.glassCard.background,
                        border: theme.glassCard.border,
                        color: theme.palette.text.primary
                    }
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
                        icon: '🟢',
                        style: {
                            backdropFilter: 'blur(16px) saturate(200%)',
                            background: theme.glassCard.background,
                            border: theme.glassCard.border,
                            color: theme.palette.text.primary,
                        }
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
                    icon: '🔴',
                    style: {
                        backdropFilter: 'blur(16px) saturate(200%)',
                        background: theme.glassCard.background,
                        border: theme.glassCard.border,
                        color: theme.palette.text.primary,
                    }
                });
            } else {
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
        } else if (error.request) {
            toast.error('No response received from the server. Please check your internet connection.', {
                icon: '🔴',
                style: {
                    backdropFilter: 'blur(16px) saturate(200%)',
                    background: theme.glassCard.background,
                    border: theme.glassCard.border,
                    color: theme.palette.text.primary,
                }
            });
        } else {
            toast.error('An error occurred while setting up the request.', {
                icon: '🔴',
                style: {
                    backdropFilter: 'blur(16px) saturate(200%)',
                    background: theme.glassCard.background,
                    border: theme.glassCard.border,
                    color: theme.palette.text.primary,
                }
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
        <GlassDialog
            open={open}
            onClose={closeModal}
            fullWidth
            maxWidth="md"
            sx={{
                '& .MuiPaper-root': {
                    backdropFilter: 'blur(16px) saturate(200%)',
                    backgroundColor: theme.glassCard.background,
                    border: theme.glassCard.border,
                    borderRadius: '16px',
                    color: theme.palette.text.primary,
                    boxShadow: theme.glassCard.boxShadow,
                }
            }}
        >
            <DialogTitle sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', pb: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                        {editMode ? 'Edit User' : 'Add New User'}
                    </Typography>
                    <IconButton
                        aria-label="close"
                        onClick={closeModal}
                        sx={{
                            color: theme.palette.grey[500],
                            '&:hover': {
                                color: theme.palette.primary.main,
                            }
                        }}
                    >
                        <ClearIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ pt: 3 }}>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        {/* Profile Image Upload */}
                        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                            <Box
                                onMouseEnter={() => setHover(true)}
                                onMouseLeave={() => setHover(false)}
                                sx={{ position: 'relative' }}
                            >
                                <Avatar
                                    src={selectedImage}
                                    alt="Profile"
                                    sx={{
                                        width: 120,
                                        height: 120,
                                        border: '4px solid rgba(255, 255, 255, 0.1)',
                                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                                        filter: hover ? 'brightness(70%)' : 'brightness(100%)',
                                        transition: 'all 0.3s ease',
                                    }}
                                />
                                <Box
                                    component="label"
                                    htmlFor="icon-button-file"
                                    sx={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        opacity: hover ? 1 : 0,
                                        transition: 'opacity 0.3s ease',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <input
                                        accept="image/*"
                                        id="icon-button-file"
                                        type="file"
                                        style={{ display: 'none' }}
                                        onChange={handleImageChange}
                                    />
                                    <PhotoCamera sx={{ color: 'white', fontSize: 32 }} />
                                </Box>
                            </Box>
                        </Grid>

                        {/* Basic Information */}
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                                <TextField
                                    label="Full Name"
                                    value={form.data.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    onBlur={() => form.validate('name')}
                                    error={form.invalid('name')}
                                    helperText={form.errors.name}
                                    InputProps={{
                                        sx: {
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            borderRadius: '8px',
                                        }
                                    }}
                                    InputLabelProps={{
                                        sx: {
                                            color: theme.palette.text.secondary,
                                        }
                                    }}
                                    required
                                />
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                                <TextField
                                    label="Username"
                                    value={form.data.user_name}
                                    onChange={(e) => handleChange('user_name', e.target.value)}
                                    onBlur={() => form.validate('user_name')}
                                    error={form.invalid('user_name')}
                                    helperText={form.errors.user_name}
                                    InputProps={{
                                        sx: {
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            borderRadius: '8px',
                                        }
                                    }}
                                    InputLabelProps={{
                                        sx: {
                                            color: theme.palette.text.secondary,
                                        }
                                    }}
                                    required
                                />
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                                <TextField
                                    label="Email"
                                    type="email"
                                    value={form.data.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    onBlur={() => form.validate('email')}
                                    error={form.invalid('email')}
                                    helperText={form.errors.email}
                                    InputProps={{
                                        sx: {
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            borderRadius: '8px',
                                        }
                                    }}
                                    InputLabelProps={{
                                        sx: {
                                            color: theme.palette.text.secondary,
                                        }
                                    }}
                                    required
                                />
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                                <TextField
                                    label="Phone"
                                    value={form.data.phone}
                                    onChange={(e) => handleChange('phone', e.target.value)}
                                    onBlur={() => form.validate('phone')}
                                    error={form.invalid('phone')}
                                    helperText={form.errors.phone}
                                    InputProps={{
                                        sx: {
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            borderRadius: '8px',
                                        }
                                    }}
                                    InputLabelProps={{
                                        sx: {
                                            color: theme.palette.text.secondary,
                                        }
                                    }}
                                />
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                                <InputLabel id="department-label" sx={{ color: theme.palette.text.secondary }}>Department</InputLabel>
                                <Select
                                    labelId="department-label"
                                    value={form.data.department_id}
                                    onChange={(e) => handleChange('department_id', e.target.value)}
                                    onBlur={() => form.validate('department_id')}
                                    label="Department"
                                    error={form.invalid('department_id')}
                                    sx={{
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        borderRadius: '8px',
                                    }}
                                >
                                    <MenuItem value="">
                                        <em>None</em>
                                    </MenuItem>
                                    {departments?.map((department) => (
                                        <MenuItem key={department.id} value={department.id}>
                                            {department.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {form.invalid('department_id') && <FormHelperText error>{form.errors.department_id}</FormHelperText>}
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                                <InputLabel id="designation-label" sx={{ color: theme.palette.text.secondary }}>Designation</InputLabel>
                                <Select
                                    labelId="designation-label"
                                    value={form.data.designation_id}
                                    onChange={(e) => handleChange('designation_id', e.target.value)}
                                    onBlur={() => form.validate('designation_id')}
                                    label="Designation"
                                    error={form.invalid('designation_id')}
                                    sx={{
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        borderRadius: '8px',
                                    }}
                                >
                                    <MenuItem value="">
                                        <em>None</em>
                                    </MenuItem>
                                    {designations?.map((designation) => (
                                        <MenuItem key={designation.id} value={designation.id}>
                                            {designation.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {form.invalid('designation_id') && <FormHelperText error>{form.errors.designation_id}</FormHelperText>}
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                                <InputLabel id="gender-label" sx={{ color: theme.palette.text.secondary }}>Gender</InputLabel>
                                <Select
                                    labelId="gender-label"
                                    value={form.data.gender}
                                    onChange={(e) => handleChange('gender', e.target.value)}
                                    onBlur={() => form.validate('gender')}
                                    label="Gender"
                                    error={form.invalid('gender')}
                                    sx={{
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        borderRadius: '8px',
                                    }}
                                >
                                    <MenuItem value="">
                                        <em>Select Gender</em>
                                    </MenuItem>
                                    <MenuItem value="male">Male</MenuItem>
                                    <MenuItem value="female">Female</MenuItem>
                                    <MenuItem value="other">Other</MenuItem>
                                </Select>
                                {form.invalid('gender') && <FormHelperText error>{form.errors.gender}</FormHelperText>}
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                                <TextField
                                    label="Employee ID"
                                    value={form.data.employee_id}
                                    onChange={(e) => handleChange('employee_id', e.target.value)}
                                    onBlur={() => form.validate('employee_id')}
                                    error={form.invalid('employee_id')}
                                    helperText={form.errors.employee_id}
                                    InputProps={{
                                        sx: {
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            borderRadius: '8px',
                                        }
                                    }}
                                    InputLabelProps={{
                                        sx: {
                                            color: theme.palette.text.secondary,
                                        }
                                    }}
                                />
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                                <TextField
                                    label="Date of Birth"
                                    type="date"
                                    value={form.data.birthday}
                                    onChange={(e) => handleChange('birthday', e.target.value)}
                                    onBlur={() => form.validate('birthday')}
                                    error={form.invalid('birthday')}
                                    helperText={form.errors.birthday}
                                    InputProps={{
                                        sx: {
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            borderRadius: '8px',
                                        }
                                    }}
                                    InputLabelProps={{
                                        shrink: true,
                                        sx: {
                                            color: theme.palette.text.secondary,
                                        }
                                    }}
                                />
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                                <TextField
                                    label="Date of Joining"
                                    type="date"
                                    value={form.data.date_of_joining}
                                    onChange={(e) => handleChange('date_of_joining', e.target.value)}
                                    onBlur={() => form.validate('date_of_joining')}
                                    error={form.invalid('date_of_joining')}
                                    helperText={form.errors.date_of_joining}
                                    InputProps={{
                                        sx: {
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            borderRadius: '8px',
                                        }
                                    }}
                                    InputLabelProps={{
                                        shrink: true,
                                        sx: {
                                            color: theme.palette.text.secondary,
                                        }
                                    }}
                                />
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                                <InputLabel id="report-to-label" sx={{ color: theme.palette.text.secondary }}>Reports To</InputLabel>
                                <Select
                                    labelId="report-to-label"
                                    value={form.data.report_to}
                                    onChange={(e) => handleChange('report_to', e.target.value)}
                                    onBlur={() => form.validate('report_to')}
                                    label="Reports To"
                                    error={form.invalid('report_to')}
                                    sx={{
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        borderRadius: '8px',
                                    }}
                                >
                                    <MenuItem value="">
                                        <em>None</em>
                                    </MenuItem>
                                    {allReportTo?.filter(u => u.id !== form.data.id).map((user) => (
                                        <MenuItem key={user.id} value={user.id}>
                                            {user.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {form.invalid('report_to') && <FormHelperText error>{form.errors.report_to}</FormHelperText>}
                            </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                            <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                                <TextField
                                    label="Address"
                                    multiline
                                    rows={3}
                                    value={form.data.address}
                                    onChange={(e) => handleChange('address', e.target.value)}
                                    onBlur={() => form.validate('address')}
                                    error={form.invalid('address')}
                                    helperText={form.errors.address}
                                    InputProps={{
                                        sx: {
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            borderRadius: '8px',
                                        }
                                    }}
                                    InputLabelProps={{
                                        sx: {
                                            color: theme.palette.text.secondary,
                                        }
                                    }}
                                />
                            </FormControl>
                        </Grid>

                        {/* Password fields (only required for new users) */}
                        {!editMode && (
                            <>
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                                        <TextField
                                            label="Password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={form.data.password}
                                            onChange={(e) => handleChange('password', e.target.value)}
                                            onBlur={() => form.validate('password')}
                                            error={form.invalid('password')}
                                            helperText={form.errors.password}
                                            required={!editMode}
                                            InputProps={{
                                                endAdornment: (
                                                    <IconButton
                                                        aria-label="toggle password visibility"
                                                        onClick={handleTogglePasswordVisibility}
                                                        edge="end"
                                                    >
                                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                ),
                                                sx: {
                                                    background: 'rgba(255, 255, 255, 0.05)',
                                                    borderRadius: '8px',
                                                }
                                            }}
                                            InputLabelProps={{
                                                sx: {
                                                    color: theme.palette.text.secondary,
                                                }
                                            }}
                                        />
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                                        <TextField
                                            label="Confirm Password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={form.data.password_confirmation}
                                            onChange={(e) => handleChange('password_confirmation', e.target.value)}
                                            onBlur={() => form.validate('password_confirmation')}
                                            error={form.invalid('password_confirmation')}
                                            helperText={form.errors.password_confirmation || (form.data.password !== form.data.password_confirmation && form.data.password_confirmation ? 'Passwords do not match' : '')}
                                            required={!editMode}
                                            InputProps={{
                                                endAdornment: (
                                                    <IconButton
                                                        aria-label="toggle password visibility"
                                                        onClick={handleTogglePasswordVisibility}
                                                        edge="end"
                                                    >
                                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                ),
                                                sx: {
                                                    background: 'rgba(255, 255, 255, 0.05)',
                                                    borderRadius: '8px',
                                                }
                                            }}
                                            InputLabelProps={{
                                                sx: {
                                                    color: theme.palette.text.secondary,
                                                }
                                            }}
                                        />
                                    </FormControl>
                                </Grid>
                            </>
                        )}
                    </Grid>
                </form>
            </DialogContent>

            <DialogActions sx={{ justifyContent: 'space-between', p: 3, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <Button
                    onClick={closeModal}
                    variant="bordered"
                    color="default"
                    size="lg"
                    className="bg-white/5 hover:bg-white/10 border border-white/10"
                    disabled={form.processing}
                >
                    Cancel
                </Button>
                <LoadingButton
                    onClick={handleSubmit}
                    loading={form.processing}
                    loadingPosition="start"
                    startIcon={<PasswordIcon />}
                    variant="contained"
                    disabled={!form.isDirty || form.processing}
                    sx={{
                        background: 'linear-gradient(45deg, #3a7bd5 0%, #2456bd 100%)',
                        boxShadow: '0 4px 20px 0 rgba(58, 123, 213, 0.4)',
                        '&:hover': {
                            background: 'linear-gradient(45deg, #2456bd 0%, #1a3c8a 100%)',
                        },
                    }}
                >
                    {editMode ? 'Update User' : 'Add User'}
                </LoadingButton>
            </DialogActions>
        </GlassDialog>
    );
};

export default AddEditUserForm;
