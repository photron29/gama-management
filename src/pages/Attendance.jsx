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
    FaCalendar,
    FaFilter,
    FaCheckCircle,
    FaTimesCircle,
    FaQuestionCircle,
    FaPlus
} from 'react-icons/fa';
import { apiClient } from '../utils/api';
import { getCurrentDateIST } from '../utils/dateTime';

const Attendance = () => {
    const { user } = useAuth();
    const [attendance, setAttendance] = useState([]);
    const [students, setStudents] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterBranch, setFilterBranch] = useState('');
    const [selectedDate, setSelectedDate] = useState(() => getCurrentDateIST());
    const [updatingStudents, setUpdatingStudents] = useState({});
    const [isMarkingMode, setIsMarkingMode] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncProgress, setSyncProgress] = useState(0);
    const [localChanges, setLocalChanges] = useState(() => {
        // Load from localStorage on mount
        const saved = localStorage.getItem('attendance_changes');
        return saved ? JSON.parse(saved) : {};
    });
    const [lastSyncTime, setLastSyncTime] = useState(() => {
        return localStorage.getItem('last_attendance_sync') || null;
    });

    useEffect(() => {
        fetchData();
    }, []);

    // Separate effect for auto-sync to avoid dependency issues
    useEffect(() => {
        // Set up auto-sync at 10 PM IST
        const checkAndSync = () => {
            const istDate = new Date();
            const istOffset = 5.5 * 60;
            istDate.setMinutes(istDate.getMinutes() + istOffset);
            
            const currentHour = istDate.getHours();
            const currentMinute = istDate.getMinutes();
            
            // Check if it's 10 PM (22:00) and we haven't synced today
            if (currentHour === 22 && currentMinute === 0) {
                const today = istDate.toISOString().split('T')[0];
                const lastSyncDate = lastSyncTime ? lastSyncTime.split('T')[0] : null;
                
                if (lastSyncDate !== today) {
                    handleSync();
                }
            }
        };

        const interval = setInterval(checkAndSync, 60000); // Check every minute
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lastSyncTime]);

    // Refresh attendance when date changes
    useEffect(() => {
        if (selectedDate) {
            fetchAttendance();
        }
    }, [selectedDate]);

    const fetchData = async () => {
        try {
            // For instructors, get only students from their assigned branches
            const params = user?.role === 'instructor' ? { instructor_id: user.id } : {};
            
            const [studentsData, branchesData] = await Promise.all([
                apiClient.getStudents(params),
                apiClient.getBranches()
            ]);
            setStudents(studentsData.students || []);
            setBranches(branchesData.branches || []);
            await fetchAttendance();
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const fetchAttendance = async () => {
        if (!selectedDate) return;
        
        try {
            const attendanceData = await apiClient.getAttendance(selectedDate);
            setAttendance(attendanceData.attendance || []);
        } catch (error) {
            console.error('Error fetching attendance:', error);
            toast.error('Failed to fetch attendance');
        }
    };

    const handleAttendanceChange = async (studentId, status) => {
        setUpdatingStudents(prev => ({ ...prev, [studentId]: true }));
        
        try {
            await apiClient.updateAttendance(studentId, selectedDate, status);
            
            // Update local state
            setAttendance(prev => {
                const existing = prev.find(a => a.student_id === studentId);
                if (existing) {
                    return prev.map(a => 
                        a.student_id === studentId 
                            ? { ...a, status, updated_at: new Date().toISOString() }
                            : a
                    );
                } else {
                    return [...prev, {
                        student_id: studentId,
                        date: selectedDate,
                        status,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }];
                }
            });

            // Store change locally for offline sync
            const changeKey = `${studentId}_${selectedDate}`;
            setLocalChanges(prev => ({
                ...prev,
                [changeKey]: { studentId, date: selectedDate, status, timestamp: Date.now() }
            }));

            toast.success(`Attendance marked as ${status}`);
        } catch (error) {
            console.error('Error updating attendance:', error);
            toast.error('Failed to update attendance');
        } finally {
            setUpdatingStudents(prev => ({ ...prev, [studentId]: false }));
        }
    };

    const handleSync = async () => {
        if (Object.keys(localChanges).length === 0) {
            toast.info('No changes to sync');
            return;
        }

        setIsSyncing(true);
        setSyncProgress(0);

        try {
            const changes = Object.values(localChanges);
            const totalChanges = changes.length;
            let processedChanges = 0;

            for (const change of changes) {
                try {
                    await apiClient.updateAttendance(
                        change.studentId,
                        change.date,
                        change.status
                    );
                    processedChanges++;
                    setSyncProgress((processedChanges / totalChanges) * 100);
                } catch (error) {
                    console.error('Error syncing change:', error);
                }
            }

            // Clear local changes after successful sync
            setLocalChanges({});
            localStorage.removeItem('attendance_changes');
            setLastSyncTime(new Date().toISOString());
            localStorage.setItem('last_attendance_sync', new Date().toISOString());

            toast.success(`Synced ${processedChanges} attendance records`);
        } catch (error) {
            console.error('Error during sync:', error);
            toast.error('Failed to sync attendance');
        } finally {
            setIsSyncing(false);
            setSyncProgress(0);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await fetchAttendance();
            toast.success('Attendance refreshed');
        } catch (error) {
            console.error('Error refreshing attendance:', error);
            toast.error('Failed to refresh attendance');
        } finally {
            setRefreshing(false);
        }
    };

    const getAttendanceStatus = (studentId) => {
        const record = attendance.find(a => a.student_id === studentId);
        return record ? record.status : null;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'present':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'absent':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'late':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'present':
                return <FaCheckCircle className="h-4 w-4" />;
            case 'absent':
                return <FaTimesCircle className="h-4 w-4" />;
            case 'late':
                return <FaExclamationTriangle className="h-4 w-4" />;
            default:
                return <FaQuestionCircle className="h-4 w-4" />;
        }
    };

    const filteredStudents = students.filter(student => {
        const matchesSearch = !searchTerm || 
            student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.email.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = !filterStatus || getAttendanceStatus(student.id) === filterStatus;
        const matchesBranch = !filterBranch || student.branch_id === filterBranch;
        
        return matchesSearch && matchesStatus && matchesBranch;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <LoadingAtom size="medium" />
                    <p className="mt-4 text-lg text-gray-600 font-medium">Loading attendance...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-7xl mx-auto">
                <SyncProgressBar
                    isVisible={isSyncing}
                    progress={syncProgress}
                    message="Syncing Attendance Records..."
                />

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Attendance Management</h1>
                        <p className="text-gray-600 dark:text-gray-400">Track and manage student attendance records</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg disabled:opacity-50"
                        >
                            <FaSyncAlt className={refreshing ? 'animate-spin' : ''} />
                            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                        </button>
                        <button
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
                        >
                            <FaPlus className="h-4 w-4" />
                            <span>Add Attendance</span>
                        </button>
                    </div>
                </div>

                {/* Modern Controls */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                        {/* Date Selector */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                            <div className="relative">
                                <FaCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700"
                                />
                            </div>
                        </div>

                        {/* Search */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Search Students</label>
                            <div className="relative">
                                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700 placeholder-gray-400"
                                />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700"
                            >
                                <option value="">All Status</option>
                                <option value="present">Present</option>
                                <option value="absent">Absent</option>
                                <option value="late">Late</option>
                            </select>
                        </div>

                        {/* Branch Filter */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Branch</label>
                            <select
                                value={filterBranch}
                                onChange={(e) => setFilterBranch(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700"
                            >
                                <option value="">All Branches</option>
                                {branches.map(branch => (
                                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Attendance Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredStudents.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-16">
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                                <FaUser className="text-4xl text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">No students found</h3>
                            <p className="text-gray-500">Try adjusting your search or filters.</p>
                        </div>
                    ) : (
                        filteredStudents.map((student) => {
                            const status = getAttendanceStatus(student.id);
                            const isUpdating = updatingStudents[student.id];
                            
                            return (
                                <div key={student.id} className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200">
                                    {/* Card Header with Gradient */}
                                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 text-white">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                                <span className="text-lg font-bold">
                                                    {student.first_name[0]}{student.last_name[0]}
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold">{student.first_name} {student.last_name}</h3>
                                                <p className="text-blue-100 text-sm">{student.email}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Details */}
                                    <div className="p-6 space-y-4">
                                        {/* Current Status */}
                                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                                            <div className="flex items-center space-x-2">
                                                {getStatusIcon(status)}
                                                <span className="text-sm font-medium text-gray-600">Current Status</span>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(status)}`}>
                                                {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Not Marked'}
                                            </span>
                                        </div>

                                        {/* Student Info */}
                                        <div className="space-y-2">
                                            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-xl">
                                                <span className="text-sm font-medium text-gray-600">Branch:</span>
                                                <span className="text-sm text-gray-700">{student.branch_name}</span>
                                            </div>
                                            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-xl">
                                                <span className="text-sm font-medium text-gray-600">Belt:</span>
                                                <span className="text-sm text-gray-700">{student.belt_level}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="p-6 pt-0 flex space-x-2">
                                        <button
                                            onClick={() => handleAttendanceChange(student.id, 'present')}
                                            disabled={updatingStudents[student.id]}
                                            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-all duration-200 font-medium disabled:opacity-50"
                                        >
                                            <FaCheck className="h-4 w-4" />
                                            <span>Present</span>
                                        </button>
                                        <button
                                            onClick={() => handleAttendanceChange(student.id, 'absent')}
                                            disabled={updatingStudents[student.id]}
                                            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-all duration-200 font-medium disabled:opacity-50"
                                        >
                                            <FaTimes className="h-4 w-4" />
                                            <span>Absent</span>
                                        </button>
                                        <button
                                            onClick={() => handleAttendanceChange(student.id, 'late')}
                                            disabled={updatingStudents[student.id]}
                                            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-xl hover:bg-yellow-200 transition-all duration-200 font-medium disabled:opacity-50"
                                        >
                                            <FaExclamationTriangle className="h-4 w-4" />
                                            <span>Late</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Sync Status */}
                {Object.keys(localChanges).length > 0 && (
                    <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                        <div className="flex items-center space-x-3">
                            <FaExclamationTriangle className="h-5 w-5 text-yellow-600" />
                            <div>
                                <h3 className="text-sm font-semibold text-yellow-800">Pending Changes</h3>
                                <p className="text-sm text-yellow-700">
                                    You have {Object.keys(localChanges).length} unsynced attendance changes. 
                                    Click "Sync" to save them to the server.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Attendance;