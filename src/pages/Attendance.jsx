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
    FaSyncAlt
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
            const utc = istDate.getTime() + (istDate.getTimezoneOffset() * 60000);
            const ist = new Date(utc + (istOffset * 60000));

            const hour = ist.getHours();
            const today = getCurrentDateIST();

            // If it's 10 PM IST and we haven't synced today
            if (hour === 22 && lastSyncTime !== today) {
                syncLocalChangesToServer();
            }
        };

        // Check every minute
        const interval = setInterval(checkAndSync, 60000);

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lastSyncTime]);

    // Refresh attendance when date changes
    useEffect(() => {
        if (!loading) {
            const refreshAttendance = async () => {
                try {
                    const freshData = await apiClient.getAttendance();
                    console.log('Fetched attendance records:', freshData.attendance);
                    console.log('Selected date:', selectedDate);
                    console.log('Matching records:', freshData.attendance.filter(r => {
                        const recordDate = r.class_date ? r.class_date.split('T')[0] : r.class_date;
                        return recordDate === selectedDate.split('T')[0];
                    }));
                    setAttendance(freshData.attendance);
                } catch (error) {
                    console.error('Error refreshing attendance:', error);
                }
            };
            refreshAttendance();
        }
    }, [selectedDate]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [attendanceData, studentsData, branchesData] = await Promise.all([
                apiClient.getAttendance(),
                apiClient.getStudents(),
                apiClient.getBranches()
            ]);
            setAttendance(attendanceData.attendance);
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
            console.log('Syncing local changes to server...');

            const totalChanges = changesToSync.length;
            for (let i = 0; i < changesToSync.length; i++) {
                const [key, change] = changesToSync[i];

                // Update progress
                const progress = Math.round(((i + 1) / totalChanges) * 100);
                setSyncProgress(progress);

                await apiClient.createAttendance({
                    student_id: change.student_id,
                    class_date: change.class_date,
                    status: change.status,
                    notes: ''
                });
            }

            // Clear localStorage after successful sync
            localStorage.removeItem('attendance_changes');
            setLocalChanges({});

            // Update last sync time
            const today = getCurrentDateIST();
            localStorage.setItem('last_attendance_sync', today);
            setLastSyncTime(today);

            toast.success('Attendance synced to server successfully');

            // Refresh from server
            const freshData = await apiClient.getAttendance();
            setAttendance(freshData.attendance);
        } catch (error) {
            console.error('Error syncing to server:', error);
            toast.error('Failed to sync attendance. Will retry at next sync time.');
        } finally {
            setIsSyncing(false);
            setSyncProgress(0);
        }
    };

    const getAttendanceForStudent = (studentId) => {
        const searchDateStr = selectedDate.split('T')[0];

        // Check local changes first
        const localKey = `${studentId}_${searchDateStr}`;
        if (localChanges[localKey]) {
            return {
                student_id: studentId,
                class_date: searchDateStr,
                status: localChanges[localKey].status
            };
        }

        // Then check server data
        const foundRecord = attendance.find(record => {
            const recordDateStr = record.class_date ? record.class_date.split('T')[0] : record.class_date;
            return record.student_id === studentId && recordDateStr === searchDateStr;
        });

        return foundRecord;
    };

    const handleAttendanceToggle = async (studentId, newStatus) => {
        setUpdatingStudents(prev => ({ ...prev, [studentId]: true }));

        try {
            const localKey = `${studentId}_${selectedDate}`;

            // Save to localStorage immediately
            const updatedChanges = {
                ...localChanges,
                [localKey]: {
                    student_id: studentId,
                    class_date: selectedDate,
                    status: newStatus,
                    timestamp: new Date().toISOString()
                }
            };

            setLocalChanges(updatedChanges);
            localStorage.setItem('attendance_changes', JSON.stringify(updatedChanges));

            // Update UI immediately without API call
            setUpdatingStudents(prev => ({ ...prev, [studentId]: false }));
        } catch (error) {
            console.error('Error updating attendance:', error);
            toast.error('Failed to update attendance');
            setUpdatingStudents(prev => ({ ...prev, [studentId]: false }));
        }
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

        if (filterStatus === '') return true;

        const attendanceRecord = getAttendanceForStudent(student.id);
        const status = attendanceRecord ? attendanceRecord.status : 'unmarked';

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
                <span>Loading attendance...</span>
            </div>
        );
    }

    return (
        <div className="attendance-page">
            <SyncProgressBar
                isVisible={isSyncing}
                progress={syncProgress}
                message="Syncing Attendance Records..."
            />
            <div className="page-header">
                <h1>Attendance</h1>
                <div className="header-actions">
                    {Object.keys(localChanges).length > 0 && (
                        <button
                            className="btn btn-warning"
                            onClick={syncLocalChangesToServer}
                            title="Sync pending changes to server"
                        >
                            <FaSyncAlt /> Sync Now ({Object.keys(localChanges).length})
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
                        onClick={() => setIsMarkingMode(!isMarkingMode)}
                    >
                        {isMarkingMode ? 'Cancel' : 'Mark Attendance'}
                    </button>
                </div>
            </div>

            {/* Controls */}
            <div className="attendance-controls">
                <div className="date-selector">
                    <label>Date:</label>
                    <div className="date-input-wrapper">
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            max={getCurrentDateIST()}
                            min={(() => {
                                const currentDate = new Date();
                                const istOffset = 5.5 * 60;
                                const utc = currentDate.getTime() + (currentDate.getTimezoneOffset() * 60000);
                                const ist = new Date(utc + (istOffset * 60000));

                                // Set limit based on user role
                                const daysLimit = user?.role === 'admin' ? 60 : 28;
                                const limitDate = new Date(ist);
                                limitDate.setDate(ist.getDate() - daysLimit);

                                return limitDate.toISOString().split('T')[0];
                            })()}
                        />
                        <small className="date-limit-info">
                            Viewing limit: {user?.role === 'admin' ? '60' : '28'} days
                        </small>
                    </div>
                </div>

                <div className="search-box">
                    <FaSearch />
                    <input
                        type="text"
                        placeholder="Search students..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

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
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="unmarked">Not Marked</option>
                </select>
            </div>

            {/* Student List */}
            <div className="student-attendance-list">
                {sortedStudents.length === 0 ? (
                    <div className="empty-state">
                        <FaExclamationTriangle className="empty-icon" />
                        <p>No students found</p>
                    </div>
                ) : (
                    sortedStudents.map((student) => {
                        const attendanceRecord = getAttendanceForStudent(student.id);
                        const status = attendanceRecord ? attendanceRecord.status : 'unmarked';
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
                                        <div className="radio-toggle-group">
                                            <button
                                                className={`radio-btn absent-btn ${status === 'absent' ? 'active' : ''}`}
                                                onClick={() => handleAttendanceToggle(student.id, 'absent')}
                                                disabled={isUpdating}
                                            >
                                                <FaTimes />
                                                <span>Absent</span>
                                            </button>
                                            <button
                                                className={`radio-btn present-btn ${status === 'present' ? 'active' : ''}`}
                                                onClick={() => handleAttendanceToggle(student.id, 'present')}
                                                disabled={isUpdating}
                                            >
                                                <FaCheck />
                                                <span>Present</span>
                                            </button>
                                        </div>
                                    ) : (
                                        /* Show status badge in view mode with quick edit */
                                        <div className="status-display">
                                            {status === 'present' && (
                                                <div className="status-badge status-present">
                                                    <FaCheck className="status-icon" />
                                                    <span className="status-text">Present</span>
                                                </div>
                                            )}
                                            {status === 'absent' && (
                                                <div className="status-badge status-absent">
                                                    <FaTimes className="status-icon" />
                                                    <span className="status-text">Absent</span>
                                                </div>
                                            )}
                                            {status === 'unmarked' && (
                                                <div className="status-badge status-unmarked">
                                                    <FaExclamationTriangle className="status-icon" />
                                                    <span className="status-text">Not Marked</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default Attendance;
