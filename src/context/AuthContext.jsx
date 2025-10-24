import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { apiClient } from '../utils/api';

const AuthContext = createContext();

const initialState = {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: true
};

const authReducer = (state, action) => {
    switch (action.type) {
        case 'LOGIN_SUCCESS':
            return {
                ...state,
                user: action.payload.user,
                token: action.payload.token,
                isAuthenticated: true,
                loading: false
            };
        case 'LOGOUT':
            return {
                ...state,
                user: null,
                token: null,
                isAuthenticated: false,
                loading: false
            };
        case 'SET_LOADING':
            return {
                ...state,
                loading: action.payload
            };
        case 'UPDATE_USER':
            return {
                ...state,
                user: { ...state.user, ...action.payload }
            };
        default:
            return state;
    }
};

export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    // Check for existing token on app load and fetch complete user data
    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');

        if (token && user) {
            try {
                const parsedUser = JSON.parse(user);
                dispatch({
                    type: 'LOGIN_SUCCESS',
                    payload: { token, user: parsedUser }
                });
                
                // Fetch complete user profile from server
                const fetchCompleteProfile = async () => {
                    try {
                        const response = await apiClient.getProfile();
                        const completeUser = response.user;
                        localStorage.setItem('user', JSON.stringify(completeUser));
                        dispatch({
                            type: 'UPDATE_USER',
                            payload: completeUser
                        });
                    } catch (error) {
                        console.error('Error fetching complete profile:', error);
                        // If profile fetch fails, continue with stored user data
                    }
                };
                
                fetchCompleteProfile();
            } catch (error) {
                console.error('Error parsing stored user data:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                dispatch({ type: 'SET_LOADING', payload: false });
            }
        } else {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, []);

    const login = async (username, password) => {
        try {
            const response = await apiClient.login({ username, password });
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            dispatch({
                type: 'LOGIN_SUCCESS',
                payload: { user: response.user, token: response.token }
            });
            return { success: true };
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        dispatch({ type: 'LOGOUT' });
    };

    const setUser = (userData) => {
        const updatedUser = { ...state.user, ...userData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        dispatch({
            type: 'UPDATE_USER',
            payload: userData
        });
    };

    const value = {
        ...state,
        login,
        logout,
        setUser
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
