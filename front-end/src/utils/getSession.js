import axios from "axios";

export const getUserSession = async () => {
    try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/check-auth`, {
            withCredentials: true
        });

        if (response.data.success) {
            return response.data.user;
        } else {
            return null;
        }

    } catch (error) {
        return null
    }
}