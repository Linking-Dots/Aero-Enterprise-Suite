import React, { useEffect, useState } from 'react';
import {
    Button,
    Input,
    Select,
    SelectItem,
    Textarea,
    Spinner,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from '@heroui/react';
import { CalendarIcon, FileTextIcon, MapPinIcon, ClockIcon } from 'lucide-react';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';


const DailyWorkForm = ({ open, closeModal, currentRow, setData, modalType}) => {
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

    const handleChange = (name, value) => {
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
                const response = await axios.post(route(`dailyWorks.${modalType}`), {
                    ruleSet: 'details',
                    ...dailyWorkData
                });

                if (response.status === 200) {
                    setData(prevWorks => prevWorks.map(work =>
                        work.id === dailyWorkData.id ? {...work, ...dailyWorkData} : work
                    ));

                    closeModal();
                    resolve([response.data.message || 'Daily work updated successfully']);
                }
            } catch (error) {
                console.error(error);
                if (error.response?.status === 422) {
                    setErrors(error.response.data.errors || {});
                    reject([error.response.data.error || 'Validation failed']);
                } else {
                    reject(['An unexpected error occurred.']);
                }
            } finally {
                setProcessing(false);
            }
        });

        toast.promise(
            promise,
            {
                pending: 'Updating daily work...',
                success: {
                    render({ data }) {
                        return data.join(', ');
                    }
                },
                error: {
                    render({ data }) {
                        return data.join(', ');
                    }
                }
            }
        );
    }

    return (
        <Modal 
            isOpen={open} 
            onClose={closeModal}
            size="3xl"
            radius={getThemeRadius()}
            scrollBehavior="inside"
            classNames={{
                base: "backdrop-blur-md mx-2 my-2 sm:mx-4 sm:my-8 max-h-[95vh]",
                backdrop: "bg-black/50 backdrop-blur-sm",
                header: "border-b border-divider",
                body: "overflow-y-auto",
                footer: "border-t border-divider",
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
                        <ModalHeader className="flex flex-col gap-1" style={{
                            borderColor: `var(--theme-divider, #E4E4E7)`,
                            fontFamily: `var(--fontFamily, "Inter")`,
                        }}>
                            <div className="flex items-center gap-2">
                                <FileTextIcon size={20} style={{ color: 'var(--theme-primary)' }} />
                                <span className="text-lg font-semibold" style={{
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}>
                                    {currentRow ? 'Edit Daily Work' : 'Add Daily Work'}
                                </span>
                            </div>
                        </ModalHeader>
                        <form onSubmit={handleSubmit}>
                            <ModalBody className="py-4 px-4 sm:py-6 sm:px-6" style={{
                                fontFamily: `var(--fontFamily, "Inter")`,
                            }}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                    {/* RFI Date */}
                                    <div className="col-span-1">
                                        <Input
                                            label="RFI Date"
                                            type="date"
                                            value={dailyWorkData.date}
                                            onValueChange={(value) => handleChange('date', value)}
                                            isInvalid={Boolean(errors.date)}
                                            errorMessage={errors.date}
                                            variant="bordered"
                                            size="sm"
                                            radius={getThemeRadius()}
                                            startContent={<CalendarIcon size={16} className="text-default-400" />}
                                            classNames={{
                                                input: "text-small",
                                                inputWrapper: "min-h-unit-10"
                                            }}
                                            style={{
                                                fontFamily: `var(--fontFamily, "Inter")`,
                                            }}
                                        />
                                    </div>

                                    {/* RFI Number */}
                                    <div className="col-span-1">
                                        <Input
                                            label="RFI Number"
                                            value={dailyWorkData.number}
                                            onValueChange={(value) => handleChange('number', value)}
                                            isInvalid={Boolean(errors.number)}
                                            errorMessage={errors.number}
                                            variant="bordered"
                                            size="sm"
                                            radius={getThemeRadius()}
                                            startContent={<FileTextIcon size={16} className="text-default-400" />}
                                            classNames={{
                                                input: "text-small",
                                                inputWrapper: "min-h-unit-10"
                                            }}
                                            style={{
                                                fontFamily: `var(--fontFamily, "Inter")`,
                                            }}
                                        />
                                    </div>

                                    {/* Type Selection */}
                                    <div className="col-span-1">
                                        <Select
                                            label="Type"
                                            placeholder="Select Work Type"
                                            selectionMode="single"
                                            selectedKeys={dailyWorkData.type ? new Set([dailyWorkData.type]) : new Set()}
                                            onSelectionChange={(keys) => {
                                                const value = Array.from(keys)[0];
                                                handleChange('type', value || '');
                                            }}
                                            isInvalid={Boolean(errors.type)}
                                            errorMessage={errors.type}
                                            variant="bordered"
                                            size="sm"
                                            radius={getThemeRadius()}
                                            startContent={<BuildingOfficeIcon size={16} className="text-default-400" />}
                                            classNames={{
                                                trigger: "min-h-unit-10",
                                                value: "text-small"
                                            }}
                                            style={{
                                                fontFamily: `var(--fontFamily, "Inter")`,
                                            }}
                                        >
                                            <SelectItem key="Structure" value="Structure">Structure</SelectItem>
                                            <SelectItem key="Embankment" value="Embankment">Embankment</SelectItem>
                                            <SelectItem key="Pavement" value="Pavement">Pavement</SelectItem>
                                        </Select>
                                    </div>

                                    {/* Location */}
                                    <div className="col-span-1">
                                        <Input
                                            label="Location"
                                            value={dailyWorkData.location}
                                            onValueChange={(value) => handleChange('location', value)}
                                            isInvalid={Boolean(errors.location)}
                                            errorMessage={errors.location}
                                            variant="bordered"
                                            size="sm"
                                            radius={getThemeRadius()}
                                            startContent={<MapPinIcon size={16} className="text-default-400" />}
                                            classNames={{
                                                input: "text-small",
                                                inputWrapper: "min-h-unit-10"
                                            }}
                                            style={{
                                                fontFamily: `var(--fontFamily, "Inter")`,
                                            }}
                                        />
                                    </div>

                                    {/* Road Type */}
                                    <div className="col-span-1">
                                        <Select
                                            label="Road Type"
                                            placeholder="Select Road Type"
                                            selectionMode="single"
                                            selectedKeys={dailyWorkData.side ? new Set([dailyWorkData.side]) : new Set()}
                                            onSelectionChange={(keys) => {
                                                const value = Array.from(keys)[0];
                                                handleChange('side', value || '');
                                            }}
                                            isInvalid={Boolean(errors.side)}
                                            errorMessage={errors.side}
                                            variant="bordered"
                                            size="sm"
                                            radius={getThemeRadius()}
                                            startContent={<MapPinIcon size={16} className="text-default-400" />}
                                            classNames={{
                                                trigger: "min-h-unit-10",
                                                value: "text-small"
                                            }}
                                            style={{
                                                fontFamily: `var(--fontFamily, "Inter")`,
                                            }}
                                        >
                                            <SelectItem key="SR-R" value="SR-R">SR-R</SelectItem>
                                            <SelectItem key="SR-L" value="SR-L">SR-L</SelectItem>
                                            <SelectItem key="TR-R" value="TR-R">TR-R</SelectItem>
                                            <SelectItem key="TR-L" value="TR-L">TR-L</SelectItem>
                                        </Select>
                                    </div>

                                    {/* Planned Time */}
                                    <div className="col-span-1">
                                        <Input
                                            label="Planned Time"
                                            value={dailyWorkData.planned_time}
                                            onValueChange={(value) => handleChange('planned_time', value)}
                                            isInvalid={Boolean(errors.planned_time)}
                                            errorMessage={errors.planned_time}
                                            variant="bordered"
                                            size="sm"
                                            radius={getThemeRadius()}
                                            startContent={<ClockIcon size={16} className="text-default-400" />}
                                            classNames={{
                                                input: "text-small",
                                                inputWrapper: "min-h-unit-10"
                                            }}
                                            style={{
                                                fontFamily: `var(--fontFamily, "Inter")`,
                                            }}
                                        />
                                    </div>

                                    {/* Quantity/Layer */}
                                    <div className="col-span-1">
                                        <Input
                                            label="Quantity/Layer No."
                                            value={dailyWorkData.qty_layer}
                                            onValueChange={(value) => handleChange('qty_layer', value)}
                                            isInvalid={Boolean(errors.qty_layer)}
                                            errorMessage={errors.qty_layer}
                                            variant="bordered"
                                            size="sm"
                                            radius={getThemeRadius()}
                                            startContent={<FileTextIcon size={16} className="text-default-400" />}
                                            classNames={{
                                                input: "text-small",
                                                inputWrapper: "min-h-unit-10"
                                            }}
                                            style={{
                                                fontFamily: `var(--fontFamily, "Inter")`,
                                            }}
                                        />
                                    </div>

                                    {/* Description */}
                                    <div className="col-span-full">
                                        <Textarea
                                            label="Description"
                                            placeholder="Please provide a detailed description of the work..."
                                            value={dailyWorkData.description}
                                            onValueChange={(value) => handleChange('description', value)}
                                            isInvalid={Boolean(errors.description)}
                                            errorMessage={errors.description}
                                            variant="bordered"
                                            size="sm"
                                            radius={getThemeRadius()}
                                            minRows={3}
                                            maxRows={5}
                                            classNames={{
                                                input: "text-small"
                                            }}
                                            style={{
                                                fontFamily: `var(--fontFamily, "Inter")`,
                                            }}
                                        />
                                    </div>
                                </div>
                            </ModalBody>
                            <ModalFooter className="flex flex-col sm:flex-row justify-center gap-2 px-4 sm:px-6 py-3 sm:py-4" style={{
                                borderColor: `var(--theme-divider, #E4E4E7)`,
                                fontFamily: `var(--fontFamily, "Inter")`,
                            }}>
                                <Button
                                    color="default"
                                    variant="bordered"
                                    onPress={onClose}
                                    radius={getThemeRadius()}
                                    size="sm"
                                    style={{
                                        borderRadius: `var(--borderRadius, 8px)`,
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    color="primary"
                                    variant="solid"
                                    isLoading={processing}
                                    isDisabled={processing || !dataChanged}
                                    radius={getThemeRadius()}
                                    size="sm"
                                    style={{
                                        borderRadius: `var(--borderRadius, 8px)`,
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}
                                >
                                    {processing ? 'Submitting...' : 'Submit'}
                                </Button>
                            </ModalFooter>
                        </form>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default DailyWorkForm;
