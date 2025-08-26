import React, { useState } from 'react';
import {Head, usePage} from "@inertiajs/react";
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import {
    Button,
    Input,
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
    Card,
    CardBody,
    CardHeader,
    Select,
    SelectItem,
    Radio,
    Spinner,
    Divider
} from '@heroui/react';
import { PlusIcon } from '@heroicons/react/24/outline';
import App from "@/Layouts/App.jsx";
import GlassCard from '@/Components/GlassCard.jsx';
import useTheme from '@/theme';

// Initial structure of leave type


const LeaveSettings = ({title}) => {

    const initialLeaveType = {
        type: '',
        days: '',
        eligibility: '',
        carry_forward: '',
        earned_leave: '',
        special_conditions: '',
    };
    const [leaveTypes, setLeaveTypes] = useState(usePage().props.leaveTypes);
    const [newLeaveType, setNewLeaveType] = useState(initialLeaveType);
    const [isEditing, setIsEditing] = useState(false);

    const theme = useTheme();

    // Handle input change for adding/editing leave types
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewLeaveType({
            ...newLeaveType,
            [name]: value,
        });
    };


    // Add a new leave type
    const addLeaveType = async () => {

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post('/add-leave-type', newLeaveType);

                if (response.status === 201) {
                    setLeaveTypes([...leaveTypes, { ...newLeaveType, id: response.data.id }]);
                    setNewLeaveType(initialLeaveType);
                    resolve(['Leave type added successfully.']);
                } else {
                    reject(['Failed to add leave type. Please try again.']);
                }
            } catch (error) {
                console.error(error);
                reject([error.response?.data?.message || 'Failed to add leave type. Please try again.']);
            }
        });

        toast.promise(
            promise,
            {
                pending: {
                    render() {
                        return (
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <Spinner size="sm" />
                                <span style={{ marginLeft: '8px' }}>Adding leave type...</span>
                            </div>
                        );
                    },
                    icon: false,
                    style: {
                        backdropFilter: 'blur(16px) saturate(200%)',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: 'white',
                    },
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
                        background: "rgba(255, 255, 255, 0.1)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        color: "white",
                    },
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
                        background: "rgba(255, 255, 255, 0.1)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        color: "white",
                    },
                },
            }
        );
    };

    // Edit existing leave type
    const editLeaveType = async (id) => {
        const leaveType = leaveTypes.find((lt) => lt.id === id);
        setNewLeaveType(leaveType);
        setIsEditing(true);
    };


    // Update leave type after editing
    const updateLeaveType = () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.put(`/update-leave-type/${newLeaveType.id}`, newLeaveType); // PUT request to update

                if (response.status === 200) {
                    // Update local state
                    const updatedLeaveTypes = leaveTypes.map((lt) =>
                        lt.id === newLeaveType.id ? { ...newLeaveType, id: response.data.id } : lt
                    );
                    setLeaveTypes(updatedLeaveTypes);
                    setNewLeaveType(initialLeaveType);
                    setIsEditing(false);
                    resolve(['Leave type updated successfully.']);
                } else {
                    reject(['Failed to update leave type. Please try again.']);
                }
            } catch (error) {
                console.error(error);
                reject([error.response?.data?.message || 'Failed to update leave type. Please try again.']);
            }
        });

        toast.promise(
            promise,
            {
                pending: {
                    render() {
                        return (
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <Spinner size="sm" />
                                <span style={{ marginLeft: '8px' }}>Updating leave type...</span>
                            </div>
                        );
                    },
                    icon: false,
                    style: {
                        backdropFilter: 'blur(16px) saturate(200%)',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: 'white',
                    },
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
                        background: "rgba(255, 255, 255, 0.1)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        color: "white",
                    },
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
                        background: "rgba(255, 255, 255, 0.1)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        color: "white",
                    },
                },
            }
        );

    };

    // Delete leave type
    const deleteLeaveType = async (id) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                // Send DELETE request to the Laravel API
                const response = await axios.delete(`/delete-leave-type/${id}`);

                if (response.status === 200) {
                    // Filter the deleted leave type from the local state
                    setLeaveTypes(leaveTypes.filter((lt) => lt.id !== id));
                    resolve([response.data.message || 'Leave type deleted successfully.']);
                } else {
                    reject(['Failed to delete leave type. Please try again.']);
                }
            } catch (error) {
                console.error(error);
                reject([error.response?.data?.message || 'Failed to delete leave type. Please try again.']);
            }
        });

        toast.promise(
            promise,
            {
                pending: {
                    render() {
                        return (
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <Spinner size="sm" />
                                <span style={{ marginLeft: '8px' }}>Deleting leave type...</span>
                            </div>
                        );
                    },
                    icon: false,
                    style: {
                        backdropFilter: 'blur(16px) saturate(200%)',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: 'white',
                    },
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
                        background: "rgba(255, 255, 255, 0.1)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        color: "white",
                    },
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
                        background: "rgba(255, 255, 255, 0.1)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        color: "white",
                    },
                },
            }
        );
    };


    return (
        <>
            <Head title={title} />
            <div className="flex justify-center p-2">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <GlassCard>
                        <CardHeader className="p-6">
                            <h2 className="text-xl font-semibold text-white">Leave Settings</h2>
                        </CardHeader>
                        <CardBody className="px-6 pb-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                                <div>
                                    <Input
                                        label="Leave Type"
                                        name="type"
                                        value={newLeaveType.type}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div>
                                    <Input
                                        label="Number of Days"
                                        name="days"
                                        type="number"
                                        value={newLeaveType.days}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div>
                                    <Select
                                        label="Carry Forward"
                                        name="carry_forward"
                                        selectedKeys={newLeaveType.carry_forward ? [String(newLeaveType.carry_forward)] : []}
                                        onSelectionChange={(keys) => {
                                            const value = Array.from(keys)[0];
                                            handleInputChange({ target: { name: 'carry_forward', value: value === 'true' } });
                                        }}
                                    >
                                        <SelectItem key="true" value="true">Yes</SelectItem>
                                        <SelectItem key="false" value="false">No</SelectItem>
                                    </Select>
                                </div>
                                <div>
                                    <Select
                                        label="Earned Leave"
                                        name="earned_leave"
                                        selectedKeys={newLeaveType.earned_leave ? [String(newLeaveType.earned_leave)] : []}
                                        onSelectionChange={(keys) => {
                                            const value = Array.from(keys)[0];
                                            handleInputChange({ target: { name: 'earned_leave', value: value === 'true' } });
                                        }}
                                    >
                                        <SelectItem key="true" value="true">Yes</SelectItem>
                                        <SelectItem key="false" value="false">No</SelectItem>
                                    </Select>
                                </div>
                                <div className="sm:col-span-2">
                                    <Input
                                        label="Eligibility Criteria"
                                        name="eligibility"
                                        value={newLeaveType.eligibility}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <Input
                                        label="Special Conditions"
                                        name="special_conditions"
                                        value={newLeaveType.special_conditions}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="col-span-full flex justify-center">
                                    <Button
                                        variant="bordered"
                                        color="primary"
                                        onPress={isEditing ? updateLeaveType : addLeaveType}
                                        startContent={<PlusIcon className="w-4 h-4" />}
                                    >
                                        {isEditing ? 'Update Leave Type' : 'Add Leave Type'}
                                    </Button>
                                </div>
                            </div>
                        </CardBody>
                        <CardBody>
                            <div className="overflow-auto max-h-[84vh]">
                                <Table aria-label="Leave types table">
                                    <TableHeader>
                                        <TableRow>
                                            <TableCell>Type</TableCell>
                                            <TableCell>Days</TableCell>
                                            <TableCell>Eligibility</TableCell>
                                            <TableCell>Carry Forward</TableCell>
                                            <TableCell>Earned Leave</TableCell>
                                            <TableCell>Special Conditions</TableCell>
                                            <TableCell>Actions</TableCell>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {leaveTypes.length > 0 ? (
                                            leaveTypes.map((leave) => (
                                                <TableRow key={leave.id}>
                                                    <TableCell>{leave.type}</TableCell>
                                                    <TableCell>{leave.days}</TableCell>
                                                    <TableCell>{leave.eligibility}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Radio
                                                                isSelected={true}
                                                                color={leave.carry_forward ? 'success' : 'danger'}
                                                                isDisabled
                                                            />
                                                            <span className={leave.carry_forward ? 'text-success' : 'text-danger'}>
                                                                {leave.carry_forward ? "Yes" : "No"}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Radio
                                                                isSelected={true}
                                                                color={leave.earned_leave ? 'success' : 'danger'}
                                                                isDisabled
                                                            />
                                                            <span className={leave.earned_leave ? 'text-success' : 'text-danger'}>
                                                                {leave.earned_leave ? "Yes" : "No"}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{leave.special_conditions ? leave.special_conditions : "N/A"}</TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="bordered"
                                                                color="primary"
                                                                size="sm"
                                                                onPress={() => editLeaveType(leave.id)}
                                                            >
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                variant="bordered"
                                                                color="danger"
                                                                size="sm"
                                                                onPress={() => deleteLeaveType(leave.id)}
                                                            >
                                                                Delete
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center">
                                                    No leave types available.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardBody>
                    </GlassCard>
                </motion.div>
            </div>
        </>


    );
};
LeaveSettings.layout = (page) => <App>{page}</App>;
    export default LeaveSettings;
