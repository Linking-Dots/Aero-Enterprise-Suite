import React, { useState, useEffect } from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Select,
    SelectItem,
    DateRangePicker,
    Checkbox,
    CheckboxGroup,
    Card,
    CardBody,
    Divider,
    RadioGroup,
    Radio,
    Chip,
    Progress
} from "@heroui/react";
import {
    DocumentArrowDownIcon,
    DocumentTextIcon,
    TableCellsIcon,
    CalendarDaysIcon,
    InformationCircleIcon,
    CheckCircleIcon
} from "@heroicons/react/24/outline";
import { Download, FileSpreadsheet, FileText, Database } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { parseDate } from "@internationalized/date";

const EnhancedDailyWorksExportForm = ({ 
    open, 
    closeModal, 
    filterData = {}, 
    users = [],
    inCharges = [] 
}) => {
    const [exportSettings, setExportSettings] = useState({
        format: 'excel',
        dateRange: {
            start: filterData.startDate ? parseDate(filterData.startDate) : null,
            end: filterData.endDate ? parseDate(filterData.endDate) : null
        },
        columns: [
            'date', 'number', 'type', 'status', 'description', 
            'location', 'incharge', 'assigned', 'completion_time', 'rfi_submission_date'
        ],
        filters: {
            status: filterData.status || 'all',
            incharge: filterData.incharge || 'all',
            type: filterData.type || 'all',
        }
    });

    const [isLoading, setIsLoading] = useState(false);
    const [preview, setPreview] = useState(null);

    const exportFormats = [
        {
            key: 'excel',
            label: 'Excel (.xlsx)',
            description: 'Comprehensive spreadsheet format',
            icon: <FileSpreadsheet size={20} className="text-green-600" />
        },
        {
            key: 'csv',
            label: 'CSV (.csv)',
            description: 'Simple comma-separated values',
            icon: <TableCellsIcon className="w-5 h-5 text-blue-600" />
        },
        {
            key: 'json',
            label: 'JSON Data',
            description: 'Structured data format',
            icon: <Database size={20} className="text-purple-600" />
        }
    ];

    const columnOptions = [
        { key: 'date', label: 'Date', description: 'RFI submission date' },
        { key: 'number', label: 'RFI Number', description: 'Unique RFI identifier' },
        { key: 'type', label: 'Type', description: 'Work type (Embankment, Structure, Pavement)' },
        { key: 'status', label: 'Status', description: 'Current work status' },
        { key: 'description', label: 'Description', description: 'Work description' },
        { key: 'location', label: 'Location', description: 'Work location/chainage' },
        { key: 'side', label: 'Side', description: 'Road side (SR-R, SR-L)' },
        { key: 'qty_layer', label: 'Quantity/Layer', description: 'Quantity or layer information' },
        { key: 'planned_time', label: 'Planned Time', description: 'Planned completion time' },
        { key: 'incharge', label: 'In Charge', description: 'Supervision engineer' },
        { key: 'assigned', label: 'Assigned To', description: 'Assigned team member' },
        { key: 'completion_time', label: 'Completion Time', description: 'Actual completion time' },
        { key: 'inspection_details', label: 'Inspection Details', description: 'Quality inspection results' },
        { key: 'resubmission_count', label: 'Resubmission Count', description: 'Number of resubmissions' },
        { key: 'rfi_submission_date', label: 'RFI Submission Date', description: 'Date RFI was submitted' }
    ];

    const statusOptions = [
        { key: 'all', label: 'All Statuses' },
        { key: 'new', label: 'New' },
        { key: 'in_progress', label: 'In Progress' },
        { key: 'review', label: 'Under Review' },
        { key: 'completed', label: 'Completed' },
        { key: 'rejected', label: 'Rejected' }
    ];

    const typeOptions = [
        { key: 'all', label: 'All Types' },
        { key: 'Embankment', label: 'Embankment' },
        { key: 'Structure', label: 'Structure' },
        { key: 'Pavement', label: 'Pavement' }
    ];

    const handleExport = async () => {
        setIsLoading(true);
        
        try {
            const exportParams = {
                columns: exportSettings.columns,
                ...exportSettings.filters,
                ...(exportSettings.dateRange.start && { 
                    startDate: exportSettings.dateRange.start.toString() 
                }),
                ...(exportSettings.dateRange.end && { 
                    endDate: exportSettings.dateRange.end.toString() 
                })
            };

            const response = await axios.post(route('dailyWorks.export'), exportParams);
            
            if (response.data.data) {
                const { data: exportData, filename } = response.data;
                
                switch (exportSettings.format) {
                    case 'excel':
                        exportToExcel(exportData, filename);
                        break;
                    case 'csv':
                        exportToCSV(exportData, filename);
                        break;
                    case 'json':
                        exportToJSON(exportData, filename);
                        break;
                }

                toast.success(`Successfully exported ${exportData.length} records`, {
                    icon: <CheckCircleIcon className="w-5 h-5" />,
                });
                
                closeModal();
            }
        } catch (error) {
            toast.error('Export failed: ' + (error.response?.data?.error || error.message));
        } finally {
            setIsLoading(false);
        }
    };

    const exportToExcel = (data, filename) => {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Daily Works');
        
        // Auto-size columns
        const cols = Object.keys(data[0] || {}).map(() => ({ wch: 20 }));
        worksheet['!cols'] = cols;
        
        XLSX.writeFile(workbook, `${filename}.xlsx`);
    };

    const exportToCSV = (data, filename) => {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToJSON = (data, filename) => {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.json`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getEstimatedRecords = () => {
        // This would ideally come from a separate API call
        return "Calculating...";
    };

    return (
        <Modal 
            isOpen={open} 
            onClose={closeModal}
            size="4xl"
            scrollBehavior="inside"
            classNames={{
                base: "backdrop-blur-md",
                backdrop: "bg-black/50 backdrop-blur-sm"
            }}
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <DocumentArrowDownIcon className="w-6 h-6 text-primary" />
                        <span>Export Daily Works</span>
                    </div>
                    <p className="text-sm text-default-500 font-normal">
                        Export daily work records with customizable options
                    </p>
                </ModalHeader>
                
                <ModalBody>
                    <div className="space-y-6">
                        {/* Export Format */}
                        <Card className="bg-default-50">
                            <CardBody>
                                <h4 className="font-semibold mb-3">Export Format</h4>
                                <RadioGroup
                                    value={exportSettings.format}
                                    onValueChange={(value) => setExportSettings(prev => ({ ...prev, format: value }))}
                                    orientation="horizontal"
                                >
                                    {exportFormats.map((format) => (
                                        <Radio key={format.key} value={format.key}>
                                            <div className="flex items-center gap-2">
                                                {format.icon}
                                                <div>
                                                    <div className="font-medium">{format.label}</div>
                                                    <div className="text-xs text-default-500">{format.description}</div>
                                                </div>
                                            </div>
                                        </Radio>
                                    ))}
                                </RadioGroup>
                            </CardBody>
                        </Card>

                        {/* Date Range */}
                        <div>
                            <h4 className="font-semibold mb-3">Date Range</h4>
                            <DateRangePicker
                                label="Select date range"
                                value={exportSettings.dateRange}
                                onChange={(range) => setExportSettings(prev => ({ 
                                    ...prev, 
                                    dateRange: range 
                                }))}
                                size="sm"
                                variant="bordered"
                            />
                        </div>

                        {/* Filters */}
                        <div>
                            <h4 className="font-semibold mb-3">Filters</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Select
                                    label="Status"
                                    selectedKeys={[exportSettings.filters.status]}
                                    onSelectionChange={(keys) => setExportSettings(prev => ({
                                        ...prev,
                                        filters: { ...prev.filters, status: Array.from(keys)[0] }
                                    }))}
                                    size="sm"
                                    variant="bordered"
                                >
                                    {statusOptions.map((status) => (
                                        <SelectItem key={status.key} value={status.key}>
                                            {status.label}
                                        </SelectItem>
                                    ))}
                                </Select>

                                <Select
                                    label="Type"
                                    selectedKeys={[exportSettings.filters.type]}
                                    onSelectionChange={(keys) => setExportSettings(prev => ({
                                        ...prev,
                                        filters: { ...prev.filters, type: Array.from(keys)[0] }
                                    }))}
                                    size="sm"
                                    variant="bordered"
                                >
                                    {typeOptions.map((type) => (
                                        <SelectItem key={type.key} value={type.key}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </Select>

                                <Select
                                    label="In Charge"
                                    selectedKeys={[exportSettings.filters.incharge]}
                                    onSelectionChange={(keys) => setExportSettings(prev => ({
                                        ...prev,
                                        filters: { ...prev.filters, incharge: Array.from(keys)[0] }
                                    }))}
                                    size="sm"
                                    variant="bordered"
                                >
                                    <SelectItem key="all" value="all">All In Charges</SelectItem>
                                    {inCharges.map((inCharge) => (
                                        <SelectItem key={inCharge.id} value={inCharge.id}>
                                            {inCharge.name}
                                        </SelectItem>
                                    ))}
                                </Select>
                            </div>
                        </div>

                        {/* Column Selection */}
                        <div>
                            <h4 className="font-semibold mb-3">Columns to Export</h4>
                            <CheckboxGroup
                                value={exportSettings.columns}
                                onValueChange={(columns) => setExportSettings(prev => ({ 
                                    ...prev, 
                                    columns 
                                }))}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {columnOptions.map((column) => (
                                        <Checkbox key={column.key} value={column.key}>
                                            <div>
                                                <div className="font-medium">{column.label}</div>
                                                <div className="text-xs text-default-500">{column.description}</div>
                                            </div>
                                        </Checkbox>
                                    ))}
                                </div>
                            </CheckboxGroup>
                        </div>

                        {/* Export Summary */}
                        <Card className="bg-primary-50 border-primary-200">
                            <CardBody>
                                <div className="flex items-start space-x-3">
                                    <InformationCircleIcon className="w-5 h-5 text-primary-600 mt-0.5" />
                                    <div>
                                        <h5 className="font-medium text-primary-900">Export Summary</h5>
                                        <div className="text-sm text-primary-700 space-y-1">
                                            <p>• Format: {exportFormats.find(f => f.key === exportSettings.format)?.label}</p>
                                            <p>• Columns: {exportSettings.columns.length} selected</p>
                                            <p>• Estimated records: {getEstimatedRecords()}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </ModalBody>
                
                <ModalFooter>
                    <Button 
                        variant="light" 
                        onPress={closeModal}
                        isDisabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button 
                        color="primary" 
                        onPress={handleExport}
                        isLoading={isLoading}
                        startContent={!isLoading && <Download size={16} />}
                        isDisabled={exportSettings.columns.length === 0}
                    >
                        {isLoading ? 'Exporting...' : 'Export Data'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default EnhancedDailyWorksExportForm;
