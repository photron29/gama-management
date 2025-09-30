import React, { createContext, useContext, useReducer, useEffect } from 'react';

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

    // Check for existing token on app load
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
            } catch (error) {
                console.error('Error parsing stored user data:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        } else {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, []);

    const login = (user, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { user, token }
        });
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        dispatch({ type: 'LOGOUT' });
    };

    const updateUser = (userData) => {
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
        updateUser
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
