import axios from "axios";

export const getUserSession = async () => {
    try {
        const response = await axios.get("http://localhost:5001/auth/check-auth", {
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