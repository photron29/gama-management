// Force production URL for deployed frontend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://gama-backend.onrender.com/api';

class ApiClient {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    getAuthHeaders() {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
        };
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        console.log('API Request:', url); // Debug log
        const config = {
            headers: this.getAuthHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
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

    // Auth endpoints
    async login(credentials) {
        return this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
    }

    async getProfile() {
        return this.request('/api/auth/profile');
    }

    async logout() {
        return this.request('/api/auth/logout', { method: 'POST' });
    }

    // Students endpoints
    async getStudents(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/api/students${queryString ? `?${queryString}` : ''}`);
    }

    async getStudent(id) {
        return this.request(`/api/students/${id}`);
    }

    async createStudent(studentData) {
        return this.request('/api/students', {
            method: 'POST',
            body: JSON.stringify(studentData)
        });
    }

    async updateStudent(id, studentData) {
        return this.request(`/api/students/${id}`, {
            method: 'PUT',
            body: JSON.stringify(studentData)
        });
    }

    async deleteStudent(id, permanent = false) {
        const queryString = permanent ? '?permanent=true' : '';
        return this.request(`/api/students/${id}${queryString}`, { method: 'DELETE' });
    }

    async getInactiveStudents() {
        return this.request('/api/students/inactive');
    }

    async restoreStudent(id) {
        return this.request(`/api/students/${id}/restore`, { method: 'POST' });
    }

    // Instructors endpoints
    async getInstructors(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/api/instructors${queryString ? `?${queryString}` : ''}`);
    }

    async getInstructor(id) {
        return this.request(`/api/instructors/${id}`);
    }

    async createInstructor(instructorData) {
        return this.request('/api/instructors', {
            method: 'POST',
            body: JSON.stringify(instructorData)
        });
    }

    async updateInstructor(id, instructorData) {
        return this.request(`/api/instructors/${id}`, {
            method: 'PUT',
            body: JSON.stringify(instructorData)
        });
    }

    async deleteInstructor(id, permanent = false) {
        const queryString = permanent ? '?permanent=true' : '';
        return this.request(`/instructors/${id}${queryString}`, { method: 'DELETE' });
    }

    async getInactiveInstructors() {
        return this.request('/instructors/inactive');
    }

    async restoreInstructor(id) {
        return this.request(`/instructors/${id}/restore`, { method: 'POST' });
    }

    // Attendance endpoints
    async getAttendance(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/attendance${queryString ? `?${queryString}` : ''}`);
    }

    async getAttendanceById(id) {
        return this.request(`/attendance/${id}`);
    }

    async createAttendance(attendanceData) {
        return this.request('/attendance', {
            method: 'POST',
            body: JSON.stringify(attendanceData)
        });
    }

    async updateAttendance(id, attendanceData) {
        return this.request(`/attendance/${id}`, {
            method: 'PUT',
            body: JSON.stringify(attendanceData)
        });
    }

    async deleteAttendance(id) {
        return this.request(`/attendance/${id}`, { method: 'DELETE' });
    }

    // Fees endpoints
    async getFees(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/fees${queryString ? `?${queryString}` : ''}`);
    }

    async getFeeById(id) {
        return this.request(`/fees/${id}`);
    }

    async createFee(feeData) {
        return this.request('/fees', {
            method: 'POST',
            body: JSON.stringify(feeData)
        });
    }

    async updateFee(id, feeData) {
        return this.request(`/fees/${id}`, {
            method: 'PUT',
            body: JSON.stringify(feeData)
        });
    }

    async deleteFee(id) {
        return this.request(`/fees/${id}`, { method: 'DELETE' });
    }

    // Dashboard endpoints
    async getDashboardStats() {
        return this.request('/dashboard/stats');
    }

    // Branches endpoints
    async getBranches(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/branches${queryString ? `?${queryString}` : ''}`);
    }

    async getBranch(id) {
        return this.request(`/branches/${id}`);
    }

    async createBranch(branchData) {
        return this.request('/branches', {
            method: 'POST',
            body: JSON.stringify(branchData)
        });
    }

    async updateBranch(id, branchData) {
        return this.request(`/branches/${id}`, {
            method: 'PUT',
            body: JSON.stringify(branchData)
        });
    }

    async deleteBranch(id) {
        return this.request(`/branches/${id}`, { method: 'DELETE' });
    }

    // Schools endpoints (using branches table for now)
    async getSchools(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/branches${queryString ? `?${queryString}` : ''}`);
    }

    async getSchool(id) {
        return this.request(`/branches/${id}`);
    }

    async createSchool(schoolData) {
        return this.request('/branches', {
            method: 'POST',
            body: JSON.stringify(schoolData)
        });
    }

    async updateSchool(id, schoolData) {
        return this.request(`/branches/${id}`, {
            method: 'PUT',
            body: JSON.stringify(schoolData)
        });
    }

    async deleteSchool(id) {
        return this.request(`/branches/${id}`, { method: 'DELETE' });
    }

    // Inventory endpoints
    async getInventory(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/inventory${queryString ? `?${queryString}` : ''}`);
    }

    async getInventoryById(id) {
        return this.request(`/inventory/${id}`);
    }

    async createInventoryItem(itemData) {
        return this.request('/inventory', {
            method: 'POST',
            body: JSON.stringify(itemData)
        });
    }

    async updateInventoryItem(id, itemData) {
        return this.request(`/inventory/${id}`, {
            method: 'PUT',
            body: JSON.stringify(itemData)
        });
    }

    async deleteInventoryItem(id) {
        return this.request(`/inventory/${id}`, { method: 'DELETE' });
    }
}

export const apiClient = new ApiClient();
