import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
    BriefcaseIcon, 
    PlusIcon,
    ChartBarIcon,
    DocumentArrowUpIcon,
    DocumentArrowDownIcon,
    MagnifyingGlassIcon,
    CheckCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import { Head } from "@inertiajs/react";
import App from "@/Layouts/App.jsx";
import DailyWorksTable from '@/Tables/DailyWorksTable.jsx';
import { 
    Card, 
    CardHeader, 
    CardBody, 
    Input, 
    Pagination,
    Button,
    Spinner,
    ScrollShadow
} from "@heroui/react";
import StatsCards from "@/Components/StatsCards.jsx";
import { useMediaQuery } from '@/Hooks/useMediaQuery.js';
import DailyWorkForm from "@/Forms/DailyWorkForm.jsx";
import DeleteDailyWorkForm from "@/Forms/DeleteDailyWorkForm.jsx";
import DailyWorksDownloadForm from "@/Forms/DailyWorksDownloadForm.jsx";
import DailyWorksUploadForm from "@/Forms/DailyWorksUploadForm.jsx";
import axios from "axios";
import { toast } from "react-toastify";

const DailyWorks = React.memo(({ auth, title, allData, jurisdictions, users, reports, reports_with_daily_works, overallEndDate, overallStartDate }) => {

    const isLargeScreen = useMediaQuery('(min-width: 1025px)');
    const isMediumScreen = useMediaQuery('(min-width: 641px) and (max-width: 1024px)');
    const isMobile = useMediaQuery('(max-width: 640px)');

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalRows, setTotalRows] = useState(0);
    const [lastPage, setLastPage] = useState(0);
    const [filteredData, setFilteredData] = useState([]);
    const [currentRow, setCurrentRow] = useState();
    const [taskIdToDelete, setTaskIdToDelete] = useState(null);
    const [openModalType, setOpenModalType] = useState(null);
    const [search, setSearch] = useState('');
    const [perPage, setPerPage] = useState(30);
    const [currentPage, setCurrentPage] = useState(1);
    
    const [filterData, setFilterData] = useState({
        status: 'all',
        incharge: 'all',
        startDate: overallStartDate,
        endDate: overallEndDate
    });

    const fetchData = async (page, perPage, filterData) => {
        setLoading(true);
        try {
            const response = await axios.get(route('dailyWorks.paginate'), {
                params: {
                    page,
                    perPage,
                    search: search,
                    status: filterData.status !== 'all' ? filterData.status : '',
                    inCharge: filterData.incharge !== 'all' ? filterData.incharge : '',
                    startDate: filterData.startDate,
                    endDate: filterData.endDate,
                }
            });

            setData(response.data.data);
            setTotalRows(response.data.total);
            setLastPage(response.data.last_page);
            setLoading(false);
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch data.', {
                icon: '🔴',
                style: {
                    backdropFilter: 'blur(16px) saturate(200%)',
                    background: 'var(--theme-content1)',
                    border: '1px solid var(--theme-divider)',
                    color: 'var(--theme-primary)',
                }
            });
            setLoading(false);
        }
    };

    const handleSearch = useCallback((event) => {
        setSearch(event.target.value);
    }, []);

    const handlePageChange = useCallback((page) => {
        setCurrentPage(page);
    }, []);

    const handleDelete = () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await fetch(`/delete-daily-work`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.head.querySelector('meta[name="csrf-token"]').content,
                    },
                    body: JSON.stringify({
                        id: taskIdToDelete,
                        page: currentPage,
                        perPage,
                    }),
                });

                if (response.ok) {
                    const result = await response.json();
                    setData(result.data);
                    setTotalRows(result.total);
                    setLastPage(result.last_page);
                    resolve('Daily work deleted successfully!');
                } else {
                    reject('Failed to delete daily work. Please try again.');
                }
            } catch (error) {
                reject('Failed to delete daily work. Please try again.');
            }
        });

        toast.promise(promise, {
            pending: 'Deleting daily work...',
            success: {
                render({ data }) {
                    return <>{data}</>;
                },
            },
            error: {
                render({ data }) {
                    return <>{data}</>;
                },
            },
        });
    };

    const handleClickOpen = useCallback((taskId, modalType) => {
        setTaskIdToDelete(taskId);
        setOpenModalType(modalType);
    }, []);

    const handleClose = useCallback(() => {
        setOpenModalType(null);
        setTaskIdToDelete(null);
    }, []);

    const openModal = useCallback((modalType) => {
        setOpenModalType(modalType);
    }, []);

    const closeModal = useCallback(() => {
        setOpenModalType(null);
    }, []);

    // Statistics
    const stats = useMemo(() => {
        const totalWorks = data.length || totalRows;
        const completedWorks = data.filter(work => work.status === 'completed').length;
        const pendingWorks = data.filter(work => work.status === 'new' || work.status === 'resubmission').length;
        const emergencyWorks = data.filter(work => work.status === 'emergency').length;

        return [
            {
                title: 'Total',
                value: totalWorks,
                icon: <ChartBarIcon className="w-5 h-5" />,
                color: 'text-blue-600',
                description: 'All work logs'
            },
            {
                title: 'Completed',
                value: completedWorks,
                icon: <CheckCircleIcon className="w-5 h-5" />,
                color: 'text-green-600',
                description: 'Finished tasks'
            },
            {
                title: 'Pending',
                value: pendingWorks,
                icon: <ClockIcon className="w-5 h-5" />,
                color: 'text-orange-600',
                description: 'In progress'
            },
            {
                title: 'Emergency',
                value: emergencyWorks,
                icon: <ExclamationTriangleIcon className="w-5 h-5" />,
                color: 'text-red-600',
                description: 'Urgent tasks'
            }
        ];
    }, [data, totalRows]);

    // Action buttons configuration
    const actionButtons = [
        ...(auth.roles.includes('Administrator') || auth.designation === 'Supervision Engineer' ? [{
            label: "Add Work",
            icon: <PlusIcon className="w-4 h-4" />,
            onPress: () => openModal('addDailyWork'),
            className: "bg-linear-to-r from-blue-500 to-purple-500 text-white font-medium"
        }] : []),
        ...(auth.roles.includes('Administrator') ? [
            {
                label: "Import",
                icon: <DocumentArrowUpIcon className="w-4 h-4" />,
                variant: "flat",
                color: "warning",
                onPress: () => openModal('importDailyWorks'),
                className: "bg-linear-to-r from-orange-500/20 to-yellow-500/20 hover:from-orange-500/30 hover:to-yellow-500/30"
            },
            {
                label: "Export",
                icon: <DocumentArrowDownIcon className="w-4 h-4" />,
                variant: "flat", 
                color: "success",
                onPress: () => openModal('exportDailyWorks'),
                className: "bg-linear-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30"
            }
        ] : [])
    ];

    useEffect(() => {
        fetchData(currentPage, perPage, filterData);
    }, [currentPage, perPage, search, filterData]);

    return (
        <>
            <Head title={title} />

            {/* Modals */}
            {openModalType === 'addDailyWork' && (
                <DailyWorkForm
                    modalType="add"
                    open={openModalType === 'addDailyWork'}
                    setData={setData}
                    closeModal={closeModal}
                />
            )}
            {openModalType === 'editDailyWork' && (
                <DailyWorkForm
                    modalType="update"
                    open={openModalType === 'editDailyWork'}
                    currentRow={currentRow}
                    setData={setData}
                    closeModal={closeModal}
                />
            )}
            {openModalType === 'deleteDailyWork' && (
                <DeleteDailyWorkForm
                    open={openModalType === 'deleteDailyWork'}
                    handleClose={handleClose}
                    handleDelete={handleDelete}
                    setData={setData}
                />
            )}
            {openModalType === 'importDailyWorks' && (
                <DailyWorksUploadForm
                    open={openModalType === 'importDailyWorks'}
                    closeModal={closeModal}
                    setData={setData}
                    setTotalRows={setTotalRows}
                />
            )}
            {openModalType === 'exportDailyWorks' && (
                <DailyWorksDownloadForm
                    open={openModalType === 'exportDailyWorks'}
                    closeModal={closeModal}
                    filterData={filterData}
                    search={search}
                    users={users}
                />
            )}

            <div className="flex justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-[2000px]"
                >
                    <Card 
                        className="transition-all duration-200"
                        style={{
                            border: `var(--borderWidth, 2px) solid transparent`,
                            borderRadius: `var(--borderRadius, 12px)`,
                            fontFamily: `var(--fontFamily, "Inter")`,
                            transform: `scale(var(--scale, 1))`,
                            background: `linear-gradient(135deg, 
                                var(--theme-content1, #FAFAFA) 20%, 
                                var(--theme-content2, #F4F4F5) 10%, 
                                var(--theme-content3, #F1F3F4) 20%)`,
                        }}
                    >
                        {/* Main Card Content */}
                        <CardHeader 
                            className="border-b p-0"
                            style={{
                                borderColor: `var(--theme-divider, #E4E4E7)`,
                                background: `linear-gradient(135deg, 
                                    color-mix(in srgb, var(--theme-content1) 50%, transparent) 20%, 
                                    color-mix(in srgb, var(--theme-content2) 30%, transparent) 10%)`,
                            }}
                        >
                            <div className={`${isLargeScreen ? 'p-6' : isMediumScreen ? 'p-4' : 'p-3'} w-full`}>
                                <div className="flex flex-col space-y-4">
                                    {/* Main Header Content */}
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                        {/* Title Section */}
                                        <div className="flex items-center gap-3 lg:gap-4">
                                            <div 
                                                className={`
                                                    ${isLargeScreen ? 'p-3' : isMediumScreen ? 'p-2.5' : 'p-2'} 
                                                    rounded-xl flex items-center justify-center
                                                `}
                                                style={{
                                                    background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                    borderColor: `color-mix(in srgb, var(--theme-primary) 25%, transparent)`,
                                                    borderWidth: `var(--borderWidth, 2px)`,
                                                    borderRadius: `var(--borderRadius, 12px)`,
                                                }}
                                            >
                                                <BriefcaseIcon 
                                                    className={`
                                                        ${isLargeScreen ? 'w-8 h-8' : isMediumScreen ? 'w-6 h-6' : 'w-5 h-5'}
                                                    `}
                                                    style={{ color: 'var(--theme-primary)' }}
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 
                                                    className={`
                                                        ${isLargeScreen ? 'text-2xl' : isMediumScreen ? 'text-xl' : 'text-lg'}
                                                        font-bold text-foreground
                                                        ${!isLargeScreen ? 'truncate' : ''}
                                                    `}
                                                    style={{
                                                        fontFamily: `var(--fontFamily, "Inter")`,
                                                    }}
                                                >
                                                    Project Work Management
                                                </h4>
                                                <p 
                                                    className={`
                                                        ${isLargeScreen ? 'text-sm' : 'text-xs'} 
                                                        text-default-500
                                                        ${!isLargeScreen ? 'truncate' : ''}
                                                    `}
                                                    style={{
                                                        fontFamily: `var(--fontFamily, "Inter")`,
                                                    }}
                                                >
                                                    Track daily work progress and project activities
                                                </p>
                                            </div>
                                        </div>
                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                {actionButtons.map((button, index) => (
                                                    <Button
                                                        key={index}
                                                        size={isLargeScreen ? "md" : "sm"}
                                                        variant={button.variant || "flat"}
                                                        color={button.color || "primary"}
                                                        startContent={button.icon}
                                                        onPress={button.onPress}
                                                        className={`${button.className || ''} font-medium`}
                                                        style={{
                                                            fontFamily: `var(--fontFamily, "Inter")`,
                                                            borderRadius: `var(--borderRadius, 12px)`,
                                                        }}
                                                    >
                                                        {button.label}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        
                        <CardBody className="pt-6">
                            {/* Quick Stats */}
                            <StatsCards stats={stats} />
                            
                            {/* Search Section */}
                            <div className="mb-6">
                                <div className="w-full sm:w-auto sm:min-w-[300px]">
                                    <Input
                                        type="text"
                                        placeholder="Search by description, location, or notes..."
                                        value={search}
                                        onChange={(e) => handleSearch(e)}
                                        variant="bordered"
                                        size={isMobile ? "sm" : "md"}
                                        radius="md"
                                        startContent={
                                            <MagnifyingGlassIcon className="w-4 h-4 text-default-400" />
                                        }
                                        classNames={{
                                            input: "text-foreground",
                                            inputWrapper: `bg-content2/50 hover:bg-content2/70 
                                                         focus-within:bg-content2/90 border-divider/50 
                                                         hover:border-divider data-[focus]:border-primary`,
                                        }}
                                        style={{
                                            fontFamily: 'var(--font-family)',
                                            borderRadius: 'var(--borderRadius)',
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Daily Works Table */}
                            <Card 
                                radius="lg"
                                className="bg-content2/50 backdrop-blur-md border border-divider/30"
                                style={{
                                    fontFamily: 'var(--font-family)',
                                    borderRadius: 'var(--borderRadius)',
                                    backgroundColor: 'var(--theme-content2)',
                                    borderColor: 'var(--theme-divider)',
                                }}
                            >
                                <CardBody className="p-4">
                                    <ScrollShadow className="max-h-[70vh]">
                                        <DailyWorksTable
                                            setData={setData}
                                            filteredData={filteredData}
                                            setFilteredData={setFilteredData}
                                            reports={reports}
                                            setCurrentRow={setCurrentRow}
                                            currentPage={currentPage}
                                            setCurrentPage={setCurrentPage}
                                            setLoading={setLoading}
                                            handleClickOpen={handleClickOpen}
                                            openModal={openModal}
                                            juniors={allData.juniors}
                                            totalRows={totalRows}
                                            lastPage={lastPage}
                                            loading={loading}
                                            allData={data}
                                            allInCharges={allData.allInCharges}
                                            jurisdictions={jurisdictions}
                                            users={users}
                                            reports_with_daily_works={reports_with_daily_works}
                                        />
                                    </ScrollShadow>
                                    
                                    {/* Pagination */}
                                    {totalRows >= 30 && (
                                        <div className="pt-4 flex justify-center items-center">
                                            <Pagination
                                                initialPage={1}
                                                isCompact={!isLargeScreen}
                                                showControls
                                                showShadow
                                                color="primary"
                                                variant="bordered"
                                                page={currentPage}
                                                total={lastPage}
                                                onChange={handlePageChange}
                                                radius="md"
                                                classNames={{
                                                    wrapper: "bg-content1/80 backdrop-blur-md border-divider/50",
                                                    item: "bg-content1/50 border-divider/30",
                                                    cursor: "bg-primary/20 backdrop-blur-md"
                                                }}
                                                style={{
                                                    fontFamily: 'var(--font-family)',
                                                }}
                                            />
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </CardBody>
                    </Card>
                </motion.div>
            </div>
        </>
    );
});

DailyWorks.layout = (page) => <App>{page}</App>;

export default DailyWorks;
