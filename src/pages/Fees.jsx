import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import LoadingAtom from '../components/LoadingAtom';
import { useAuth } from '../context/AuthContext';
import SyncProgressBar from '../components/SyncProgressBar';
import {
    FaSearch,
    FaUser,
    FaCheck,
    FaTimes,
    FaExclamationTriangle,
    FaSyncAlt,
    FaRupeeSign,
    FaEdit,
    FaChevronDown,
    FaChevronUp,
    FaCheckCircle
} from 'react-icons/fa';
import { apiClient } from '../utils/api';
import { getCurrentDateIST, getCurrentMonthIST, getFeeDueDate } from '../utils/dateTime';

const Fees = () => {
    const { user } = useAuth();
    const [fees, setFees] = useState([]);
    const [students, setStudents] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterBranch, setFilterBranch] = useState('');
    const [filterDuration, setFilterDuration] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(() => getCurrentMonthIST());
    const [updatingStudents, setUpdatingStudents] = useState({});
    const [isMarkingMode, setIsMarkingMode] = useState(false);
    const [isIndividualMode, setIsIndividualMode] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncProgress, setSyncProgress] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const [localChanges, setLocalChanges] = useState(() => {
        // Load from localStorage on mount
        const saved = localStorage.getItem('fees_changes');
        return saved ? JSON.parse(saved) : {};
    });
    const [lastSyncTime, setLastSyncTime] = useState(() => {
        return localStorage.getItem('last_fees_sync') || null;
    });
    const [expandedStudent, setExpandedStudent] = useState(null);
    const [editFormData, setEditFormData] = useState({
        amount: 1000,
        payment_method: 'cash',
        notes: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    // Separate effect for auto-sync to avoid dependency issues
    useEffect(() => {
        // Set up auto-sync at 10 PM IST and monthly reset on 1st
        const checkAndSync = () => {
            const istDate = new Date();
            const istOffset = 5.5 * 60;
            const utc = istDate.getTime() + (istDate.getTimezoneOffset() * 60000);
            const ist = new Date(utc + (istOffset * 60000));

            const hour = ist.getHours();
            const day = ist.getDate();
            const today = getCurrentDateIST();

            // If it's 10 PM IST and we haven't synced today
            if (hour === 22 && lastSyncTime !== today) {
                syncLocalChangesToServer();
            }

            // Monthly reset on 1st of month at 10 PM IST
            if (day === 1 && hour === 22) {
                resetFeesToPending();
            }

            // Auto-overdue on 10th of month at 10 PM IST
            if (day === 10 && hour === 22) {
                markPendingFeesAsOverdue();
            }
        };

        // Check every minute
        const interval = setInterval(checkAndSync, 60000);

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lastSyncTime]);

    // Refresh fees when month changes
    useEffect(() => {
        if (!loading) {
            fetchData();
        }
    }, [selectedMonth]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [feesData, studentsData, branchesData] = await Promise.all([
                apiClient.getFees(),
                apiClient.getStudents(),
                apiClient.getBranches()
            ]);
            setFees(feesData.fees);
            setStudents(studentsData.students || []);
            setBranches(branchesData);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const syncLocalChangesToServer = async () => {
        const changesToSync = Object.entries(localChanges);
        if (changesToSync.length === 0) return;

        try {
            setIsSyncing(true);
            setSyncProgress(0);
            console.log('Syncing local fee changes to server...');
            console.log('Total changes to sync:', changesToSync.length);

            let successCount = 0;
            let errorCount = 0;
            const totalChanges = changesToSync.length;

            for (let i = 0; i < changesToSync.length; i++) {
                const [key, change] = changesToSync[i];

                // Update progress
                const progress = Math.round(((i + 1) / totalChanges) * 100);
                setSyncProgress(progress);
                try {
                    console.log('Syncing fee record:', {
                        key,
                        student_id: change.student_id,
                        amount: change.amount,
                        due_date: change.due_date,
                        status: change.status
                    });

                    await apiClient.createFee({
                        student_id: change.student_id,
                        amount: change.amount,
                        fee_type: 'monthly',
                        due_date: change.due_date,
                        status: change.status,
                        payment_method: change.status === 'paid' ? 'cash' : null,
                        notes: ''
                    });

                    successCount++;
                    console.log('✓ Successfully synced fee for student:', change.student_id);
                } catch (error) {
                    errorCount++;
                    console.error('✗ Failed to sync fee for student:', change.student_id, error);
                }
            }

            console.log(`Sync complete: ${successCount} success, ${errorCount} errors`);

            // Only clear successful syncs or show appropriate message
            if (errorCount === 0) {
                // Clear localStorage after successful sync
                localStorage.removeItem('fees_changes');
                setLocalChanges({});

                // Update last sync time
                const today = getCurrentDateIST();
                localStorage.setItem('last_fees_sync', today);
                setLastSyncTime(today);

                toast.success(`All ${successCount} fee records synced successfully`);
            } else if (successCount > 0) {
                toast.warning(`Partially synced: ${successCount} success, ${errorCount} failed`);
            } else {
                toast.error(`Failed to sync all ${errorCount} fee records`);
            }

            // Refresh from server
            const freshData = await apiClient.getFees();
            setFees(freshData.fees);
        } catch (error) {
            console.error('Error syncing fees to server:', error);
            toast.error('Failed to sync fees. Will retry at next sync time.');
        } finally {
            setIsSyncing(false);
            setSyncProgress(0);
        }
    };

    const getFeeForStudent = (studentId) => {
        const [year, month] = selectedMonth.split('-');

        // Check local changes first
        const localKey = `${studentId}_${year}-${month}`;
        if (localChanges[localKey]) {
            return {
                student_id: studentId,
                due_date: `${year}-${month}-01`,
                status: localChanges[localKey].status,
                amount: localChanges[localKey].amount
            };
        }

        // Then check server data
        const foundRecord = fees.find(record => {
            if (record.student_id !== studentId) return false;

            const feeDate = new Date(record.due_date);
            const feeYear = feeDate.getFullYear();
            const feeMonth = feeDate.getMonth() + 1;

            return feeYear === parseInt(year) && feeMonth === parseInt(month);
        });

        return foundRecord;
    };

    const getStudentFeeHistory = (studentId) => {
        const studentFees = [];
        const currentDate = new Date();
        const istOffset = 5.5 * 60;
        const utc = currentDate.getTime() + (currentDate.getTimezoneOffset() * 60000);
        const ist = new Date(utc + (istOffset * 60000));

        // Get last 12 months (most recent first)
        for (let i = 0; i < 12; i++) {
            const date = new Date(ist.getFullYear(), ist.getMonth() - i, 1);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const monthKey = `${year}-${month}`;
            const dueDate = `${year}-${month}-10`;

            // Check local changes first
            const localKey = `${studentId}_${year}-${month}`;
            let feeRecord = null;

            if (localChanges[localKey]) {
                feeRecord = {
                    student_id: studentId,
                    due_date: dueDate,
                    status: localChanges[localKey].status,
                    amount: localChanges[localKey].amount,
                    payment_method: localChanges[localKey].payment_method,
                    notes: localChanges[localKey].notes
                };
            } else {
                // Check server data
                feeRecord = fees.find(record => {
                    if (record.student_id !== studentId) return false;
                    const feeDate = new Date(record.due_date);
                    const feeYear = feeDate.getFullYear();
                    const feeMonth = feeDate.getMonth() + 1;
                    return feeYear === year && feeMonth === parseInt(month);
                });
            }

            studentFees.push({
                month: monthKey,
                monthName: date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
                dueDate: dueDate,
                feeRecord: feeRecord,
                isOverdue: feeRecord && feeRecord.status !== 'paid' && new Date(dueDate) < new Date()
            });
        }

        return studentFees;
    };

    const hasUnpaidFees = (studentId) => {
        const currentDate = new Date();
        const istOffset = 5.5 * 60;
        const utc = currentDate.getTime() + (currentDate.getTimezoneOffset() * 60000);
        const ist = new Date(utc + (istOffset * 60000));

        // Check last 12 months for any unpaid fees
        for (let i = 0; i < 12; i++) {
            const date = new Date(ist.getFullYear(), ist.getMonth() - i, 1);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const monthKey = `${year}-${month}`;
            const dueDate = `${year}-${month}-10`;

            // Check local changes first
            const localKey = `${studentId}_${year}-${month}`;
            let feeRecord = null;

            if (localChanges[localKey]) {
                feeRecord = {
                    status: localChanges[localKey].status,
                    due_date: dueDate
                };
            } else {
                // Check server data
                feeRecord = fees.find(record => {
                    if (record.student_id !== studentId) return false;
                    const feeDate = new Date(record.due_date);
                    const feeYear = feeDate.getFullYear();
                    const feeMonth = feeDate.getMonth() + 1;
                    return feeYear === year && feeMonth === parseInt(month);
                });
            }

            // If there's a fee record and it's not paid, and it's overdue
            if (feeRecord && feeRecord.status !== 'paid' && new Date(dueDate) < new Date()) {
                return true;
            }
        }

        return false;
    };

    const resetFeesToPending = async () => {
        try {
            setIsSyncing(true);
            setSyncProgress(0);
            console.log('🔄 Monthly fee reset: Setting all fees to pending...');

            // Get all active students only
            const response = await apiClient.getStudents();
            const activeStudents = response.filter(student => student.is_active);

            console.log(`📊 Processing ${activeStudents.length} active students for monthly fee reset`);

            const currentDate = new Date();
            const istOffset = 5.5 * 60;
            const utc = currentDate.getTime() + (currentDate.getTimezoneOffset() * 60000);
            const ist = new Date(utc + (istOffset * 60000));

            const currentYear = ist.getFullYear();
            const currentMonth = ist.getMonth() + 1;
            const dueDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-10`;

            // Get previous month's fees to inherit amounts
            const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
            const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

            // Reset fees for all active students
            const totalStudents = activeStudents.length;
            for (let i = 0; i < activeStudents.length; i++) {
                const student = activeStudents[i];

                // Update progress
                const progress = Math.round(((i + 1) / totalStudents) * 100);
                setSyncProgress(progress);
                try {
                    // Get the student's fee amount from previous month
                    let inheritedAmount = 1000; // Default amount

                    // Look for previous month's fee record
                    const previousFee = fees.find(fee =>
                        fee.student_id === student.id &&
                        fee.fee_type === 'monthly' &&
                        new Date(fee.due_date).getFullYear() === previousYear &&
                        new Date(fee.due_date).getMonth() + 1 === previousMonth
                    );

                    if (previousFee && previousFee.amount) {
                        inheritedAmount = previousFee.amount;
                        console.log(`📊 Inheriting amount ${inheritedAmount} for student ${student.first_name} ${student.last_name}`);
                    }

                    await apiClient.createFee({
                        student_id: student.id,
                        amount: inheritedAmount,
                        fee_type: 'monthly',
                        due_date: dueDate,
                        status: 'pending',
                        payment_method: null,
                        notes: 'Monthly fee reset - inherited amount'
                    });
                } catch (error) {
                    console.error(`Failed to reset fee for student ${student.id}:`, error);
                }
            }

            // Refresh data
            await fetchData();

            console.log('✅ Monthly fee reset completed');
            toast.success('Monthly fees reset to pending status with inherited amounts');

        } catch (error) {
            console.error('❌ Monthly fee reset failed:', error);
            toast.error('Failed to reset monthly fees');
        } finally {
            setIsSyncing(false);
            setSyncProgress(0);
        }
    };

    // Mark pending fees as overdue on 10th of month
    const markPendingFeesAsOverdue = async () => {
        try {
            setIsSyncing(true);
            setSyncProgress(0);
            console.log('🔄 Auto-overdue: Marking pending fees as overdue...');

            // Get all pending fees
            const pendingFees = await apiClient.getFees();
            const feesToUpdate = pendingFees.fees.filter(fee => fee.status === 'pending');

            if (feesToUpdate.length === 0) {
                console.log('✅ No pending fees to mark as overdue');
                return;
            }

            let successCount = 0;
            let failCount = 0;

            for (let i = 0; i < feesToUpdate.length; i++) {
                try {
                    await apiClient.updateFee(feesToUpdate[i].id, {
                        status: 'overdue'
                    });
                    successCount++;
                } catch (error) {
                    console.error(`Failed to mark fee ${feesToUpdate[i].id} as overdue:`, error);
                    failCount++;
                }

                // Update progress
                setSyncProgress(Math.round(((i + 1) / feesToUpdate.length) * 100));
            }

            console.log(`✅ Auto-overdue completed: ${successCount} fees marked as overdue, ${failCount} failed`);

            if (successCount > 0) {
                toast.success(`${successCount} fees automatically marked as overdue`);
            }
            if (failCount > 0) {
                toast.error(`${failCount} fees failed to update`);
            }

        } catch (error) {
            console.error('Error in auto-overdue process:', error);
            toast.error('Failed to mark fees as overdue');
        } finally {
            setIsSyncing(false);
            setSyncProgress(0);
        }
    };

    const getUnpaidMonths = (studentId) => {
        const unpaidMonths = [];
        const currentDate = new Date();
        const istOffset = 5.5 * 60;
        const utc = currentDate.getTime() + (currentDate.getTimezoneOffset() * 60000);
        const ist = new Date(utc + (istOffset * 60000));

        // Check last 12 months
        for (let i = 11; i >= 0; i--) {
            const date = new Date(ist.getFullYear(), ist.getMonth() - i, 1);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const monthKey = `${year}-${month}`;

            // Check local changes first
            const localKey = `${studentId}_${year}-${month}`;
            let feeRecord = localChanges[localKey];

            if (!feeRecord) {
                // Check server data
                feeRecord = fees.find(record => {
                    if (record.student_id !== studentId) return false;
                    const feeDate = new Date(record.due_date);
                    const feeYear = feeDate.getFullYear();
                    const feeMonth = feeDate.getMonth() + 1;
                    return feeYear === year && feeMonth === parseInt(month);
                });
            }

            if (feeRecord && feeRecord.status !== 'paid') {
                const monthName = date.toLocaleDateString('en-US', { month: 'short' });
                unpaidMonths.push(monthName);
            }
        }

        return unpaidMonths;
    };

    const hasFeesInDuration = (studentId, duration) => {
        if (!duration) return true; // No duration filter

        const currentDate = new Date();
        const istOffset = 5.5 * 60;
        const utc = currentDate.getTime() + (currentDate.getTimezoneOffset() * 60000);
        const ist = new Date(utc + (istOffset * 60000));

        let monthsToCheck = 0;
        switch (duration) {
            case '1month':
                monthsToCheck = 1;
                break;
            case '3months':
                monthsToCheck = 3;
                break;
            case '6months':
                monthsToCheck = 6;
                break;
            case '1year':
                monthsToCheck = 12;
                break;
            default:
                return true;
        }

        // Check specified number of months for any fee records
        for (let i = 0; i < monthsToCheck; i++) {
            const date = new Date(ist.getFullYear(), ist.getMonth() - i, 1);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const monthKey = `${year}-${month}`;

            // Check local changes first
            const localKey = `${studentId}_${year}-${month}`;
            let hasLocalRecord = localChanges[localKey] !== undefined;

            if (!hasLocalRecord) {
                // Check server data
                hasLocalRecord = fees.some(record => {
                    if (record.student_id !== studentId) return false;
                    const feeDate = new Date(record.due_date);
                    const feeYear = feeDate.getFullYear();
                    const feeMonth = feeDate.getMonth() + 1;
                    return feeYear === year && feeMonth === parseInt(month);
                });
            }

            if (hasLocalRecord) return true;
        }

        return false;
    };

    const handleFeeToggle = async (studentId, newStatus, customData = null) => {
        setUpdatingStudents(prev => ({ ...prev, [studentId]: true }));

        try {
            const [year, month] = selectedMonth.split('-');
            // Due date is always 10th of the month
            const dueDate = `${year}-${month}-10`;
            const localKey = `${studentId}_${year}-${month}`;

            // Map newStatus to match database constraints: 'pending', 'paid', 'overdue'
            // If status is not 'paid', use 'pending' instead of 'unpaid'
            const dbStatus = newStatus === 'paid' ? 'paid' : 'pending';

            // Inherit amount from previous month or use custom/default
            let inheritedAmount = 1000; // Default amount

            // Look for previous month's fee record
            const currentMonth = parseInt(month);
            const currentYear = parseInt(year);
            const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
            const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

            const previousFee = fees.find(fee =>
                fee.student_id === studentId &&
                fee.fee_type === 'monthly' &&
                new Date(fee.due_date).getFullYear() === previousYear &&
                new Date(fee.due_date).getMonth() + 1 === previousMonth
            );

            if (previousFee && previousFee.amount) {
                inheritedAmount = previousFee.amount;
            }

            // Use custom data if provided, otherwise use inherited/defaults
            const feeData = customData || {
                amount: editFormData.amount || inheritedAmount,
                payment_method: dbStatus === 'paid' ? (editFormData.payment_method || 'cash') : null,
                notes: editFormData.notes || ''
            };

            // Save to localStorage immediately
            const updatedChanges = {
                ...localChanges,
                [localKey]: {
                    student_id: studentId,
                    amount: feeData.amount,
                    due_date: dueDate,
                    status: dbStatus,
                    payment_method: feeData.payment_method,
                    notes: feeData.notes,
                    timestamp: new Date().toISOString()
                }
            };

            setLocalChanges(updatedChanges);
            localStorage.setItem('fees_changes', JSON.stringify(updatedChanges));

            // Collapse the expanded form after saving
            if (expandedStudent === studentId) {
                setExpandedStudent(null);
            }

            // Update UI immediately without API call
            setUpdatingStudents(prev => ({ ...prev, [studentId]: false }));
        } catch (error) {
            console.error('Error updating fee:', error);
            toast.error('Failed to update fee status');
            setUpdatingStudents(prev => ({ ...prev, [studentId]: false }));
        }
    };

    const toggleExpand = (studentId, feeRecord) => {
        if (expandedStudent === studentId) {
            setExpandedStudent(null);
        } else {
            setExpandedStudent(studentId);
            // Pre-fill form with existing data if available
            if (feeRecord) {
                setEditFormData({
                    amount: feeRecord.amount || 1000,
                    payment_method: feeRecord.payment_method || 'cash',
                    notes: feeRecord.notes || ''
                });
            } else {
                setEditFormData({
                    amount: 1000,
                    payment_method: 'cash',
                    notes: ''
                });
            }
        }
    };

    const handleIndividualFeeToggle = async (studentId, monthKey, newStatus) => {
        setUpdatingStudents(prev => ({ ...prev, [studentId]: true }));

        try {
            const [year, month] = monthKey.split('-');
            const dueDate = `${year}-${month}-10`;
            const localKey = `${studentId}_${year}-${month}`;

            // Map newStatus to match database constraints
            const dbStatus = newStatus === 'paid' ? 'paid' : 'pending';

            // Inherit amount from previous month or use default
            let inheritedAmount = 1000; // Default amount

            // Look for previous month's fee record
            const currentMonth = parseInt(month);
            const currentYear = parseInt(year);
            const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
            const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

            const previousFee = fees.find(fee =>
                fee.student_id === studentId &&
                fee.fee_type === 'monthly' &&
                new Date(fee.due_date).getFullYear() === previousYear &&
                new Date(fee.due_date).getMonth() + 1 === previousMonth
            );

            if (previousFee && previousFee.amount) {
                inheritedAmount = previousFee.amount;
            }

            // Save to localStorage immediately
            const updatedChanges = {
                ...localChanges,
                [localKey]: {
                    student_id: studentId,
                    amount: editFormData.amount || inheritedAmount,
                    due_date: dueDate,
                    status: dbStatus,
                    payment_method: dbStatus === 'paid' ? (editFormData.payment_method || 'cash') : null,
                    notes: editFormData.notes || '',
                    timestamp: new Date().toISOString()
                }
            };

            setLocalChanges(updatedChanges);
            localStorage.setItem('fees_changes', JSON.stringify(updatedChanges));

            // Update UI immediately without API call
            setUpdatingStudents(prev => ({ ...prev, [studentId]: false }));
        } catch (error) {
            console.error('Error updating individual fee:', error);
            toast.error('Failed to update fee status');
            setUpdatingStudents(prev => ({ ...prev, [studentId]: false }));
        }
    };

    const startIndividualMode = (student) => {
        setSelectedStudent(student);
        setIsIndividualMode(true);
        setIsMarkingMode(false);
        setExpandedStudent(null);
    };

    const exitIndividualMode = () => {
        setSelectedStudent(null);
        setIsIndividualMode(false);
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await fetchData();
            toast.success('Data refreshed successfully');
        } catch (error) {
            toast.error('Failed to refresh data');
        } finally {
            setRefreshing(false);
        }
    };

    const filteredStudents = students.filter(student => {
        // Only show active students
        if (!student.is_active) return false;

        const matchesSearch = searchTerm === '' ||
            `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesBranch = filterBranch === '' || student.branch_id === parseInt(filterBranch);

        if (!matchesSearch || !matchesBranch) return false;

        // Filter by duration (must have fees in specified period)
        if (filterDuration && !hasFeesInDuration(student.id, filterDuration)) {
            return false;
        }

        if (filterStatus === '') return true;

        const feeRecord = getFeeForStudent(student.id);
        const status = feeRecord ? feeRecord.status : 'pending';

        return filterStatus === status;
    });

    // Sort students alphabetically by last name, then first name
    const sortedStudents = [...filteredStudents].sort((a, b) => {
        const lastNameCompare = a.last_name.toLowerCase().localeCompare(b.last_name.toLowerCase());
        if (lastNameCompare !== 0) return lastNameCompare;
        return a.first_name.toLowerCase().localeCompare(b.first_name.toLowerCase());
    });

    if (loading) {
        return (
            <div className="table-loading">
                <LoadingAtom size="medium" />
                <span>Loading fees...</span>
            </div>
        );
    }

    return (
        <div className="attendance-page">
            <SyncProgressBar
                isVisible={isSyncing}
                progress={syncProgress}
                message={syncProgress > 0 && syncProgress < 100 ? "Syncing Fee Records..." : "Monthly Fee Reset..."}
            />
            <div className="page-header">
                <h1>Fees Management</h1>
                <div className="header-actions">
                    {Object.keys(localChanges).length > 0 && (
                        <button
                            className="btn btn-warning"
                            onClick={syncLocalChangesToServer}
                            disabled={isSyncing}
                            title="Sync pending changes to server"
                        >
                            {isSyncing ? (
                                <>
                                    <LoadingAtom size="small" />
                                    Syncing... ({Object.keys(localChanges).length})
                                </>
                            ) : (
                                <>
                                    <FaSyncAlt /> Sync Now ({Object.keys(localChanges).length})
                                </>
                            )}
                        </button>
                    )}
                    <button
                        className="btn btn-icon"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        title="Refresh data"
                    >
                        <FaSyncAlt className={refreshing ? 'spinning' : ''} />
                    </button>
                    <button
                        className={`btn ${isMarkingMode ? 'btn-secondary' : 'btn-primary'}`}
                        onClick={() => {
                            setIsMarkingMode(!isMarkingMode);
                            setIsIndividualMode(false);
                            setSelectedStudent(null);
                        }}
                    >
                        {isMarkingMode ? 'Cancel' : 'Mark Fees'}
                    </button>
                    <button
                        className={`btn ${isIndividualMode ? 'btn-secondary' : 'btn-outline'}`}
                        onClick={() => {
                            if (isIndividualMode) {
                                exitIndividualMode();
                            } else {
                                setIsIndividualMode(true);
                                setIsMarkingMode(false);
                            }
                        }}
                    >
                        {isIndividualMode ? 'Exit Individual' : 'Mark Individual'}
                    </button>
                </div>
            </div>

            {/* Controls */}
            <div className="attendance-controls">
                {isMarkingMode && (
                    <div className="date-selector">
                        <label>Month:</label>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="month-selector"
                        >
                            {(() => {
                                const months = [];
                                const currentDate = new Date();
                                const istOffset = 5.5 * 60;
                                const utc = currentDate.getTime() + (currentDate.getTimezoneOffset() * 60000);
                                const ist = new Date(utc + (istOffset * 60000));

                                // Show last 12 months in descending order (most recent first)
                                for (let i = 0; i < 12; i++) {
                                    const date = new Date(ist.getFullYear(), ist.getMonth() - i, 1);
                                    const year = date.getFullYear();
                                    const month = String(date.getMonth() + 1).padStart(2, '0');
                                    const value = `${year}-${month}`;
                                    const label = date.toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long'
                                    });
                                    months.push(
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    );
                                }
                                return months;
                            })()}
                        </select>
                    </div>
                )}

                {!isMarkingMode && (
                    <div className="search-box">
                        <FaSearch />
                        <input
                            type="text"
                            placeholder="Search students..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                )}

                {!isMarkingMode && (
                    <>
                        {user?.role === 'admin' && (
                            <select
                                value={filterBranch}
                                onChange={(e) => setFilterBranch(e.target.value)}
                                className="filter-select"
                            >
                                <option value="">All Branches</option>
                                {branches.map(branch => (
                                    <option key={branch.id} value={branch.id}>
                                        {branch.name}
                                    </option>
                                ))}
                            </select>
                        )}

                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="filter-select"
                        >
                            <option value="">All Status</option>
                            <option value="paid">Paid</option>
                            <option value="pending">Pending</option>
                            <option value="overdue">Overdue</option>
                        </select>

                        <select
                            value={filterDuration}
                            onChange={(e) => setFilterDuration(e.target.value)}
                            className="filter-select"
                        >
                            <option value="">All Duration</option>
                            <option value="1month">Past 1 Month</option>
                            <option value="3months">Past 3 Months</option>
                            <option value="6months">Past 6 Months</option>
                            <option value="1year">Past 1 Year</option>
                        </select>
                    </>
                )}

            </div>

            {/* Individual Mode */}
            {isIndividualMode && (
                <div className="individual-mode">
                    <div className="individual-header">
                        <h3>Individual Fee Management</h3>
                        <p>Select a student to view and manage their fee history across multiple months</p>
                    </div>
                    <div className="student-selection">
                        {sortedStudents.map((student) => (
                            <button
                                key={student.id}
                                className={`student-select-btn ${selectedStudent?.id === student.id ? 'active' : ''}`}
                                onClick={() => startIndividualMode(student)}
                            >
                                <FaUser />
                                <span>{student.first_name} {student.last_name}</span>
                                <small>{student.belt_name || 'Unknown'}</small>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Individual Student Fee History */}
            {isIndividualMode && selectedStudent && (
                <div className="individual-fee-history">
                    <div className="history-header">
                        <h4>{selectedStudent.first_name} {selectedStudent.last_name} - Fee History</h4>
                        <button className="btn btn-sm btn-outline" onClick={exitIndividualMode}>
                            Back to Student List
                        </button>
                    </div>
                    <div className="fee-history-list">
                        {getStudentFeeHistory(selectedStudent.id).map((fee) => (
                            <div key={fee.month} className={`fee-history-item ${fee.isOverdue ? 'overdue' : ''}`}>
                                <div className="fee-month-info">
                                    <h5>{fee.monthName}</h5>
                                    <p>Due: {fee.dueDate}</p>
                                    {fee.isOverdue && <span className="overdue-badge">Overdue</span>}
                                </div>
                                <div className="fee-status-actions">
                                    {fee.feeRecord ? (
                                        <div className="fee-record">
                                            <div className={`status-badge status-${fee.feeRecord.status}`}>
                                                {fee.feeRecord.status === 'paid' ? (
                                                    <>
                                                        <FaCheck className="status-icon" />
                                                        <span>Paid (₹{fee.feeRecord.amount})</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaTimes className="status-icon" />
                                                        <span>Pending (₹{fee.feeRecord.amount})</span>
                                                    </>
                                                )}
                                            </div>
                                            <div className="fee-actions">
                                                <button
                                                    className={`btn btn-sm ${fee.feeRecord.status === 'pending' ? 'btn-success' : 'btn-outline'}`}
                                                    onClick={() => handleIndividualFeeToggle(selectedStudent.id, fee.month, 'pending')}
                                                    disabled={updatingStudents[selectedStudent.id]}
                                                >
                                                    {fee.feeRecord.status === 'pending' ? 'Mark as Pending' : 'Set to Pending'}
                                                </button>
                                                <button
                                                    className={`btn btn-sm ${fee.feeRecord.status === 'paid' ? 'btn-success' : 'btn-outline'}`}
                                                    onClick={() => handleIndividualFeeToggle(selectedStudent.id, fee.month, 'paid')}
                                                    disabled={updatingStudents[selectedStudent.id]}
                                                >
                                                    {fee.feeRecord.status === 'paid' ? 'Mark as Paid' : 'Set to Paid'}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="no-fee-record">
                                            <span className="no-record-text">No fee record</span>
                                            <div className="fee-actions">
                                                <button
                                                    className="btn btn-sm btn-outline"
                                                    onClick={() => handleIndividualFeeToggle(selectedStudent.id, fee.month, 'pending')}
                                                    disabled={updatingStudents[selectedStudent.id]}
                                                >
                                                    Mark as Pending
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-primary"
                                                    onClick={() => handleIndividualFeeToggle(selectedStudent.id, fee.month, 'paid')}
                                                    disabled={updatingStudents[selectedStudent.id]}
                                                >
                                                    Mark as Paid
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Regular Student List */}
            {!isIndividualMode && (
                <div className="student-attendance-list">
                    {sortedStudents.length === 0 ? (
                        <div className="empty-state">
                            <FaExclamationTriangle className="empty-icon" />
                            <p>No students found</p>
                        </div>
                    ) : (
                        sortedStudents.map((student) => {
                            const feeRecord = getFeeForStudent(student.id);
                            const status = feeRecord ? feeRecord.status : 'pending';
                            const isUpdating = updatingStudents[student.id];

                            return (
                                <div key={student.id} className={`student-attendance-card status-${status}`}>
                                    <div className="student-info">
                                        <FaUser className="student-icon" />
                                        <div className="student-details">
                                            <h3>{student.first_name} {student.last_name}</h3>
                                            <p>
                                                {user?.role === 'admin' && <>{student.branch_name} • </>}
                                                {student.belt_name || 'Unknown'}
                                            </p>
                                            {(() => {
                                                const unpaidMonths = getUnpaidMonths(student.id);
                                                if (unpaidMonths.length > 0) {
                                                    return (
                                                        <p className="unpaid-months">
                                                            <FaExclamationTriangle className="unpaid-icon" />
                                                            Unpaid: {unpaidMonths.join(', ')}
                                                        </p>
                                                    );
                                                } else {
                                                    return (
                                                        <p className="all-paid">
                                                            <FaCheckCircle className="paid-icon" />
                                                            All fees paid
                                                        </p>
                                                    );
                                                }
                                            })()}
                                        </div>
                                    </div>

                                    {/* Show radio-style buttons in marking mode, status with quick toggle otherwise */}
                                    <div className="attendance-actions">
                                        {isUpdating ? (
                                            <div className="updating-indicator">
                                                <LoadingAtom size="small" />
                                                <span>Updating...</span>
                                            </div>
                                        ) : isMarkingMode ? (
                                            <div className="fee-marking-actions">
                                                <button
                                                    className="btn-icon-small"
                                                    onClick={() => toggleExpand(student.id, feeRecord)}
                                                    title="Edit fee details"
                                                >
                                                    {expandedStudent === student.id ? <FaChevronUp /> : <FaEdit />}
                                                </button>
                                                <div className="radio-toggle-group">
                                                    <button
                                                        className={`radio-btn absent-btn ${status === 'pending' ? 'active' : ''}`}
                                                        onClick={() => handleFeeToggle(student.id, 'pending')}
                                                        disabled={isUpdating}
                                                    >
                                                        <FaTimes />
                                                        <span>Pending</span>
                                                    </button>
                                                    <button
                                                        className={`radio-btn present-btn ${status === 'paid' ? 'active' : ''}`}
                                                        onClick={() => handleFeeToggle(student.id, 'paid')}
                                                        disabled={isUpdating}
                                                    >
                                                        <FaCheck />
                                                        <span>Paid</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            /* Show status badge in view mode */
                                            <div className="status-display">
                                                {status === 'paid' && (
                                                    <div className="status-badge status-present">
                                                        <FaCheck className="status-icon" />
                                                        <span className="status-text">Paid ({feeRecord?.amount || 1000})</span>
                                                    </div>
                                                )}
                                                {status === 'pending' && (
                                                    <div className="status-badge status-absent">
                                                        <FaTimes className="status-icon" />
                                                        <span className="status-text">Pending ({feeRecord?.amount || 1000})</span>
                                                    </div>
                                                )}
                                                {status === 'overdue' && (
                                                    <div className="status-badge status-absent" style={{ background: '#dc3545' }}>
                                                        <FaExclamationTriangle className="status-icon" />
                                                        <span className="status-text">Overdue ({feeRecord?.amount || 1000})</span>
                                                    </div>
                                                )}
                                                {status === 'pending' && (
                                                    <div className="status-badge status-pending">
                                                        <FaExclamationTriangle className="status-icon" />
                                                        <span className="status-text">Pending</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Expandable fee details form */}
                                    {expandedStudent === student.id && isMarkingMode && (
                                        <div className="fee-details-form">
                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label>Amount (₹)</label>
                                                    <input
                                                        type="number"
                                                        value={editFormData.amount}
                                                        onChange={(e) => setEditFormData({ ...editFormData, amount: parseFloat(e.target.value) })}
                                                        min="0"
                                                        step="0.01"
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>Payment Method</label>
                                                    <select
                                                        value={editFormData.payment_method}
                                                        onChange={(e) => setEditFormData({ ...editFormData, payment_method: e.target.value })}
                                                    >
                                                        <option value="cash">Cash</option>
                                                        <option value="card">Credit Card</option>
                                                        <option value="upi">UPI</option>
                                                        <option value="bank_transfer">Bank Transfer</option>
                                                        <option value="cheque">Cheque</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                <label>Notes (optional)</label>
                                                <textarea
                                                    value={editFormData.notes}
                                                    onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                                                    rows="2"
                                                    placeholder="Add any additional notes..."
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};

export default Fees;
