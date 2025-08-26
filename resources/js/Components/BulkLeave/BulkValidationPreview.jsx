import React from 'react';
import { 
    Card, 
    CardBody, 
    CardHeader, 
    Chip, 
    Spinner, 
    Divider, 
    Progress 
} from '@heroui/react';

import { 
    CheckCircleIcon, 
    ExclamationTriangleIcon, 
    XCircleIcon,
    InformationCircleIcon 
} from '@heroicons/react/24/outline';

const BulkValidationPreview = ({ 
    validationResults = [], 
    balanceImpact = null,
    isValidating = false 
}) => {

    
    if (validationResults.length === 0 && !isValidating) {
        return null;
    }

    // Count validation statuses
    const validCount = validationResults.filter(r => r.status === 'valid').length;
    const warningCount = validationResults.filter(r => r.status === 'warning').length;
    const conflictCount = validationResults.filter(r => r.status === 'conflict').length;
    const totalCount = validationResults.length;

    // Get status icon and color
    const getStatusIcon = (status) => {
        const iconProps = { className: "w-4 h-4" };
        switch (status) {
            case 'valid':
                return <CheckCircleIcon {...iconProps} className="w-4 h-4 text-success" />;
            case 'warning':
                return <ExclamationTriangleIcon {...iconProps} className="w-4 h-4 text-warning" />;
            case 'conflict':
                return <XCircleIcon {...iconProps} className="w-4 h-4 text-danger" />;
            default:
                return <InformationCircleIcon {...iconProps} className="w-4 h-4 text-default-400" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'valid':
                return 'success';
            case 'warning':
                return 'warning';
            case 'conflict':
                return 'danger';
            default:
                return 'default';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Summary Card */}
            <Card>
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between w-full">
                        <h3 className="text-lg font-semibold">Validation Results</h3>
                        {isValidating && (
                            <div className="flex items-center gap-2">
                                <Spinner size="sm" />
                                <span className="text-sm text-default-600">
                                    Validating...
                                </span>
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardBody className="pt-0">
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                            <h4 className="text-2xl font-bold text-success">
                                {validCount}
                            </h4>
                            <p className="text-sm text-success">
                                Valid
                            </p>
                        </div>
                        <div className="text-center">
                            <h4 className="text-2xl font-bold text-warning">
                                {warningCount}
                            </h4>
                            <p className="text-sm text-warning">
                                Warnings
                            </p>
                        </div>
                        <div className="text-center">
                            <h4 className="text-2xl font-bold text-danger">
                                {conflictCount}
                            </h4>
                            <p className="text-sm text-danger">
                                Conflicts
                            </p>
                        </div>
                    </div>

                    {/* Balance Impact */}
                    {balanceImpact && (
                        <div className="p-4 rounded-lg bg-default-50 border border-default-200">
                            <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                                <InformationCircleIcon className="w-4 h-4 text-primary" />
                                Leave Balance Impact
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-sm text-default-600">
                                        Leave Type:
                                    </span>
                                    <span className="text-sm font-medium ml-2">
                                        {balanceImpact.leave_type}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-sm text-default-600">
                                        Current Balance:
                                    </span>
                                    <span className="text-sm font-medium ml-2">
                                        {balanceImpact.current_balance} days
                                    </span>
                                </div>
                                <div>
                                    <span className="text-sm text-default-600">
                                        Requested Days:
                                    </span>
                                    <span className="text-sm font-medium ml-2">
                                        {balanceImpact.requested_days} days
                                    </span>
                                </div>
                                <div>
                                    <span className="text-sm text-default-600">
                                        Remaining Balance:
                                    </span>
                                    <span className={`text-sm font-medium ml-2 ${
                                        balanceImpact.remaining_balance < 0 ? 'text-danger' : 'text-success'
                                    }`}>
                                        {balanceImpact.remaining_balance} days
                                    </span>
                                </div>
                            </div>
                            
                            {balanceImpact.remaining_balance < 0 && (
                                <div className="mt-4 p-3 rounded-md bg-danger-50 border border-danger-200">
                                    <p className="text-sm text-danger">
                                        ⚠️ This request exceeds your available leave balance by {Math.abs(balanceImpact.remaining_balance)} days.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Detailed Results */}
            {validationResults.length > 0 && (
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold">Date-by-Date Results</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                            {validationResults.map((result, index) => (
                                <div 
                                    key={index}
                                    className="flex items-start justify-between p-4 rounded-lg border border-default-200 hover:border-default-300 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        {getStatusIcon(result.status)}
                                        <div>
                                            <p className="text-sm font-medium">
                                                {formatDate(result.date)}
                                            </p>
                                            <p className="text-xs text-default-500">
                                                {result.date}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col items-end gap-1">
                                        <Chip 
                                            size="sm" 
                                            variant="bordered" 
                                            color={getStatusColor(result.status)}
                                            className="capitalize"
                                        >
                                            {result.status}
                                        </Chip>
                                        
                                        {/* Errors */}
                                        {result.errors && result.errors.length > 0 && (
                                            <div className="text-right">
                                                {result.errors.map((error, errorIndex) => (
                                                    <p key={errorIndex} className="text-xs text-danger">
                                                        {error}
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                        
                                        {/* Warnings */}
                                        {result.warnings && result.warnings.length > 0 && (
                                            <div className="text-right">
                                                {result.warnings.map((warning, warningIndex) => (
                                                    <p key={warningIndex} className="text-xs text-warning">
                                                        {warning}
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>
            )}
        </div>
    );
};

export default BulkValidationPreview;
