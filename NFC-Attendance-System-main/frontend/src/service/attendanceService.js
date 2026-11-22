import apiClient from './apiClient';

export const getAttendance = async ({ studentUID, month, classId, managerId } = {}) => {
  try {
    const response = await apiClient.get('/api/attendances', {
      params: {
        ...(studentUID ? { studentUID } : {}),
        ...(month ? { month } : {}),
        ...(classId ? { classId } : {}),
        ...(managerId ? { managerId } : {}),
      },
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    } else {
      throw new Error('Error getting attendance.');
    }
  }
};

export const getAttendanceSummary = async ({ month, classId, managerId } = {}) => {
  try {
    const response = await apiClient.get('/api/attendances/summary', {
      params: {
        ...(month ? { month } : {}),
        ...(classId ? { classId } : {}),
        ...(managerId ? { managerId } : {}),
      },
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    } else {
      throw new Error('Error getting attendance summary.');
    }
  }
};

export const getBranchEmployees = async ({ classId, managerId } = {}) => {
  try {
    const response = await apiClient.get('/api/attendances/employees', {
      params: {
        ...(classId ? { classId } : {}),
        ...(managerId ? { managerId } : {}),
      },
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    } else {
      throw new Error('Error getting branch employees.');
    }
  }
};