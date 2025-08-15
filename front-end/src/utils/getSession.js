import axios from "axios";

export const getUserSession = async () => {
    const backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/check-auth`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    try {
        const response = await axios.get(backendUrl, {
            withCredentials: true,
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (response.data.success) return response.data.user;
        return null;
    } catch (error) {
        return null;
    }
};