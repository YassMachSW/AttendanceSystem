import apiClient from './apiClient';

export const loginUser = async (email, password) => {
  try {
    const response = await apiClient.post('/api/user/login', {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    } else {
      throw new Error('Error logging in. Please try again.');
    }
  }
};

export const addEmployee = async ({ email, name, surname, password, classId }) => {
  try {
    const response = await apiClient.post('/api/user/employees', {
      email,
      name,
      surname,
      password,
      ...(classId ? { classId } : {}),
    });
    return response.data;
  } catch (error) {
    const status = error.response?.status;
    const serverMsg = error.response?.data?.message;
    if (serverMsg) {
      throw new Error(serverMsg);
    }
    throw new Error(
      status
        ? `שגיאה מהשרת (${status}) בהוספת העובד.`
        : `שגיאה בהוספת העובד (${error.message || 'בעיית רשת/שרת'}). נסי שוב.`
    );
  }
};

export const changeUserPassword = async ({ userId, currentPassword, newPassword }) => {
  try {
    const response = await apiClient.put('/api/user/change-password', {
      userId,
      currentPassword,
      newPassword,
    });
    return response.data;
  } catch (error) {
    const status = error.response?.status;
    const serverMsg = error.response?.data?.message;
    if (serverMsg) {
      throw new Error(serverMsg);
    }
    throw new Error(
      status
        ? `שגיאה מהשרת (${status}) בעדכון הסיסמה.`
        : `שגיאה בעדכון הסיסמה (${error.message || 'בעיית רשת/שרת'}). נסי שוב.`
    );
  }
};