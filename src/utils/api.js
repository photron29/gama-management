const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiClient {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    getAuthHeaders(isFormData = false) {
        const token = localStorage.getItem('token');
        return {
            ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
            ...(token && { Authorization: `Bearer ${token}` }),
        };
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const isFormData = options.body instanceof FormData;

        const config = {
            ...options,
            headers: { ...this.getAuthHeaders(isFormData), ...(options.headers || {}) },
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                let errorData = {};
                try {
                    errorData = await response.json();
                } catch {
                    errorData = { error: response.statusText };
                }
                const error = new Error(errorData.error || `HTTP error! status: ${response.status}`);
                error.response = { data: errorData, status: response.status };
                throw error;
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // --- Auth ---
    login(credentials) {
        return this.request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
    }

    getProfile() {
        return this.request('/auth/profile');
    }

    updateUser(userData) {
        return this.request('/auth/profile', { method: 'PUT', body: JSON.stringify(userData) });
    }

    logout() {
        return this.request('/auth/logout', { method: 'POST' });
    }

    // --- Students ---
    getStudents(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/students${queryString ? `?${queryString}` : ''}`);
    }

    getStudent(id) {
        return this.request(`/students/${id}`);
    }

    createStudent(studentData) {
        // Detect if there's a file
        const hasFile = studentData.photo instanceof File;
        const body = hasFile ? this.toFormData(studentData) : JSON.stringify(studentData);
        return this.request('/students', { method: 'POST', body });
    }

    updateStudent(id, studentData) {
        const hasFile = studentData.photo instanceof File;
        const body = hasFile ? this.toFormData(studentData) : JSON.stringify(studentData);
        return this.request(`/students/${id}`, { method: 'PUT', body });
    }

    deleteStudent(id, permanent = false) {
        const queryString = permanent ? '?permanent=true' : '';
        return this.request(`/students/${id}${queryString}`, { method: 'DELETE' });
    }

    getInactiveStudents() {
        return this.request('/students/inactive');
    }

    restoreStudent(id) {
        return this.request(`/students/${id}/restore`, { method: 'POST' });
    }

    // --- Utility to convert object to FormData ---
    toFormData(obj) {
        const formData = new FormData();
        Object.entries(obj).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                formData.append(key, value);
            }
        });
        return formData;
    }

    // --- Instructors ---
    getInstructors(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/instructors${queryString ? `?${queryString}` : ''}`);
    }

    getInstructor(id) {
        return this.request(`/instructors/${id}`);
    }

    createInstructor(instructorData) {
        return this.request('/instructors', { method: 'POST', body: JSON.stringify(instructorData) });
    }

    updateInstructor(id, instructorData) {
        return this.request(`/instructors/${id}`, { method: 'PUT', body: JSON.stringify(instructorData) });
    }

    updateOwnProfile(profileData) {
        return this.request('/instructor/profile', { method: 'PUT', body: JSON.stringify(profileData) });
    }

    deleteInstructor(id, permanent = false) {
        const queryString = permanent ? '?permanent=true' : '';
        return this.request(`/instructors/${id}${queryString}`, { method: 'DELETE' });
    }

    getInactiveInstructors() {
        return this.request('/instructors/inactive');
    }

    restoreInstructor(id) {
        return this.request(`/instructors/${id}/restore`, { method: 'POST' });
    }

    // --- Attendance ---
    getAttendance(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/attendance${queryString ? `?${queryString}` : ''}`);
    }

    getAttendanceById(id) {
        return this.request(`/attendance/${id}`);
    }

    createAttendance(attendanceData) {
        return this.request('/attendance', { method: 'POST', body: JSON.stringify(attendanceData) });
    }

    updateAttendance(id, attendanceData) {
        return this.request(`/attendance/${id}`, { method: 'PUT', body: JSON.stringify(attendanceData) });
    }

    deleteAttendance(id) {
        return this.request(`/attendance/${id}`, { method: 'DELETE' });
    }

    createAttendanceApproval(approvalData) {
        return this.request('/attendance/approval', { method: 'POST', body: JSON.stringify(approvalData) });
    }

    getAttendanceApprovals() {
        return this.request('/attendance/approvals');
    }

    updateAttendanceApproval(id, status) {
        return this.request(`/attendance/approval/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
    }

    // --- Products ---
    getProducts() {
        return this.request('/products');
    }

    getProduct(id) {
        return this.request(`/products/${id}`);
    }

    getProductsByCategory(category) {
        return this.request(`/products/category/${category}`);
    }

    getProductCategories() {
        return this.request('/products/categories/list');
    }

    // --- Orders ---
    createOrder(orderData) {
        return this.request('/orders', { method: 'POST', body: JSON.stringify(orderData) });
    }

    getMyOrders() {
        return this.request('/orders/my-orders');
    }

    getOrder(id) {
        return this.request(`/orders/${id}`);
    }

    getAllOrders() {
        return this.request('/orders');
    }

    updateOrderStatus(id, statusData) {
        return this.request(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify(statusData) });
    }

    getOrderStats() {
        return this.request('/orders/stats/overview');
    }

    // --- Fees ---
    getFees(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/fees${queryString ? `?${queryString}` : ''}`);
    }

    getFeeById(id) {
        return this.request(`/fees/${id}`);
    }

    createFee(feeData) {
        return this.request('/fees', { method: 'POST', body: JSON.stringify(feeData) });
    }

    updateFee(id, feeData) {
        return this.request(`/fees/${id}`, { method: 'PUT', body: JSON.stringify(feeData) });
    }

    deleteFee(id) {
        return this.request(`/fees/${id}`, { method: 'DELETE' });
    }

    // --- Dashboard ---
    getDashboardStats() {
        return this.request('/dashboard/stats');
    }

    // --- Branches / Schools ---
    getBranches(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/branches${queryString ? `?${queryString}` : ''}`);
    }

    getBranch(id) {
        return this.request(`/branches/${id}`);
    }

    createBranch(branchData) {
        return this.request('/branches', { method: 'POST', body: JSON.stringify(branchData) });
    }

    updateBranch(id, branchData) {
        return this.request(`/branches/${id}`, { method: 'PUT', body: JSON.stringify(branchData) });
    }

    deleteBranch(id) {
        return this.request(`/branches/${id}`, { method: 'DELETE' });
    }

    // Inventory
    getInventory(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/inventory${queryString ? `?${queryString}` : ''}`);
    }

    getInventoryById(id) {
        return this.request(`/inventory/${id}`);
    }

    createInventoryItem(itemData) {
        return this.request('/inventory', { method: 'POST', body: JSON.stringify(itemData) });
    }

    updateInventoryItem(id, itemData) {
        return this.request(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify(itemData) });
    }

    deleteInventoryItem(id) {
        return this.request(`/inventory/${id}`, { method: 'DELETE' });
    }

    // --- Announcements ---
    getAnnouncements() {
        return this.request('/announcements');
    }

    getAnnouncementById(id) {
        return this.request(`/announcements/${id}`);
    }

    createAnnouncement(announcementData) {
        return this.request('/announcements', { method: 'POST', body: JSON.stringify(announcementData) });
    }

    updateAnnouncement(id, announcementData) {
        return this.request(`/announcements/${id}`, { method: 'PUT', body: JSON.stringify(announcementData) });
    }

    deleteAnnouncement(id) {
        return this.request(`/announcements/${id}`, { method: 'DELETE' });
    }

    // --- Notifications ---
    getNotifications() {
        return this.request('/announcements/notifications/all');
    }

    getOrderNotifications() {
        return this.request('/announcements/notifications/orders');
    }

    markNotificationAsRead(id) {
        return this.request(`/announcements/notifications/${id}/read`, { method: 'PUT' });
    }

    markAllNotificationsAsRead() {
        return this.request('/announcements/notifications/read-all', { method: 'PUT' });
    }
}

export const apiClient = new ApiClient();
