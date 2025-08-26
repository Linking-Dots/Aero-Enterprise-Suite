import React, { useEffect, useState } from 'react';
import {
    Button,
    Input,
    Select,
    SelectItem,
    Spinner,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from '@heroui/react';
import { X } from 'lucide-react';
import { toast } from 'react-toastify';
import GlassDialog from '@/Components/GlassDialog.jsx';


const DailyWorkForm = ({ open, closeModal, currentRow, setData, modalType}) => {

    const [dailyWorkData, setDailyWorkData] = useState({
        id: currentRow?.id || '',
        date: currentRow?.date || new Date().toISOString().split('T')[0],
        number: currentRow?.number || '',
        planned_time: currentRow?.planned_time || '',
        type: currentRow?.type || 'Structure',
        location: currentRow?.location || '',
        description: currentRow?.description || '',
        side: currentRow?.side || 'SR-R',
        qty_layer: currentRow?.qty_layer || '',
    });

    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);
    const [dataChanged, setDataChanged] = useState(false);

    useEffect(() => {
        // Check if any field is changed
        const hasChanges = Object.values(dailyWorkData).some(value => value !== '');
        setDataChanged(hasChanges);
    }, [dailyWorkData]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setDailyWorkData(prevData => ({
            ...prevData,
            [name]: value,
        }));
        setDataChanged(true);
    };

    async function handleSubmit(event) {
        event.preventDefault();
        setProcessing(true);
        const promise = new Promise(async (resolve, reject) => {
            try {

                const response = await axios.post(route(`dailyWorks.${modalType}`),{
                    ruleSet: 'details',
                    ...dailyWorkData
                });

                if (response.status === 200) {
                    setData(prevWorks => prevWorks.map(work =>
                        work.id === dailyWorkData.id ? {...work, ...dailyWorkData} : work
                    ));

                    closeModal();
                    resolve(response.data.message ? [response.data.message] : response.data.messages);
                    setProcessing(false);
                    closeModal();
                }
            } catch (error) {
                setProcessing(false);
                // setErrors(error.response.data.errors);
                console.error(error)
                reject(['An unexpected error occurred.']);
            }
        });

        toast.promise(
            promise,
            {
                pending: {
                    render() {
                        return (
                            <div style={{display: 'flex', alignItems: 'center'}}>
                                <Spinner size="sm" />
                                <span style={{marginLeft: '8px'}}>Updating daily work ...</span>
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
                    render({data}) {
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
                    render({data}) {
                        return (
                            <>
                                {data.map((message, index) => (
                                    <div key={index}>{message}</div>
                                ))}
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
    };

    return (
        <GlassDialog open={open} onClose={closeModal}>
            <ModalContent>
                <ModalHeader className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Add Task</h2>
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
                                variant="bordered"
                                label="RFI Date"
                                type="date"
                                name="date"
                                value={dailyWorkData.date}
                                onChange={(e) => handleChange(e)}
                                isInvalid={Boolean(errors.date)}
                                errorMessage={errors.date}
                            />
                        </div>
                        <div className="col-span-1">
                            <Input
                                variant="bordered"
                                label="RFI Number"
                                name="number"
                                value={dailyWorkData.number}
                                onChange={(e) => handleChange(e)}
                                isInvalid={Boolean(errors.number)}
                                errorMessage={errors.number}
                            />
                        </div>
                        <div className="col-span-1">
                            <Input
                                variant="bordered"
                                label="Planned Time"
                                name="planned_time"
                                value={dailyWorkData.planned_time}
                                onChange={(e) => handleChange(e)}
                                isInvalid={Boolean(errors.planned_time)}
                                errorMessage={errors.planned_time}
                            />
                        </div>
                        <div className="col-span-1">
                            <Select
                                variant="underlined"
                                label="Type"
                                name="type"
                                className="w-full"
                                value={dailyWorkData.type}
                                isInvalid={Boolean(errors.type)}
                                errorMessage={errors.type}
                                labelId="type-label"
                                selectedKeys={[dailyWorkData.type]}
                                popoverProps={{
                                    classNames: {
                                        content: "bg-transparent backdrop-blur-lg border-inherit",
                                    },
                                }}
                            >
                                <SelectItem key="Structure" value="Structure">Structure</SelectItem>
                                <SelectItem key="Embankment" value="Embankment">Embankment</SelectItem>
                                <SelectItem key="Pavement" value="Pavement">Pavement</SelectItem>
                            </Select>
                        </div>
                        <div className="col-span-1">
                            <Input
                                variant="bordered"
                                label="Location"
                                name="location"
                                value={dailyWorkData.location}
                                onChange={(e) => handleChange(e)}
                                isInvalid={Boolean(errors.location)}
                                errorMessage={errors.location}
                            />
                        </div>
                        <div className="col-span-1">
                            <Input
                                variant="bordered"
                                label="Description"
                                name="description"
                                value={dailyWorkData.description}
                                onChange={(e) => handleChange(e)}
                                isInvalid={Boolean(errors.description)}
                                errorMessage={errors.description}
                            />
                        </div>
                        <div className="col-span-1">
                            <Select
                                variant="underlined"
                                label="Road Type"
                                name="side"
                                className="w-full"
                                value={dailyWorkData.side}
                                onChange={handleChange}
                                isInvalid={Boolean(errors.side)}
                                errorMessage={errors.side}
                                selectedKeys={[dailyWorkData.side]}
                                popoverProps={{
                                    classNames: {
                                        content: "bg-transparent backdrop-blur-lg border-inherit",
                                    },
                                }}
                            >
                                <SelectItem key="SR-R" value="SR-R">SR-R</SelectItem>
                                <SelectItem key="SR-L" value="SR-L">SR-L</SelectItem>
                                <SelectItem key="TR-R" value="TR-R">TR-R</SelectItem>
                                <SelectItem key="TR-L" value="TR-L">TR-L</SelectItem>
                            </Select>
                        </div>
                        <div className="col-span-1">
                            <Input
                                variant="bordered"
                                label="Quantity/Layer No."
                                name="qty_layer"
                                value={dailyWorkData.qty_layer}
                                onChange={(e) => handleChange(e)}
                                isInvalid={Boolean(errors.qty_layer)}
                                errorMessage={errors.qty_layer}
                            />
                        </div>
                        </div>
                    </ModalBody>
                    <ModalFooter className="flex justify-end"
                    >
                        <Button
                            isDisabled={!dataChanged}
                            radius={'lg'}
                            variant="bordered"
                            color="primary"
                            type="submit"
                            isLoading={processing}
                        >
                            Submit
                        </Button>
                    </ModalFooter>
                </form>
            </ModalContent>
        </GlassDialog>
    );
};

export default DailyWorkForm;
