import axios from 'axios';

const API_URL = import.meta.env.VITE_BACK_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No hay token de autenticación');
  }
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
};

export const getAllTasks = async () => {
  try {
    const config = getAuthHeaders();
    console.log('Configuración de la petición:', config);

    const response = await axios.get(`${API_URL}/tasks`, config);
    return response.data;
  } catch (error) {
    console.error('Error en getAllTasks:', error);
    if (error.response?.status === 403) {
      throw new Error('No tienes permisos para ver las tareas');
    }
    throw new Error('Error al obtener tareas');
  }
};

export const taskService = {
  getAllTasks: async () => {
    try {
      const config = getAuthHeaders();
      const response = await axios.get(`${API_URL}/tasks`, config);
      return response.data;
    } catch (error) {
      console.error('Error en getAllTasks:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener las tareas');
    }
  },

  getFormData: async () => {
    try {
      const config = getAuthHeaders();
      const response = await axios.get(`${API_URL}/task-form-data`, config);
      return response.data;
    } catch (error) {
      console.error('Error al obtener datos del formulario:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener datos del formulario');
    }
  },

  createTask: async (taskData) => {
    try {
      const requiredFields = [
        'title',
        'due_date',
        'assigned_to',
        'company_id',
        'area_id',
        'status',
      ];
      for (let field of requiredFields) {
        if (!taskData[field]) {
          console.error(`${field} es obligatorio`);
          throw new Error(`${field} es obligatorio`);
        }
      }
  
      const today = new Date().toLocaleDateString('en-CA'); // Usa formato YYYY-MM-DD
      if (taskData.due_date && taskData.due_date < today) {
        throw new Error('La fecha de vencimiento no puede ser anterior a hoy');
      }
  
      const response = await axios.post(`${API_URL}/tasks`, {
        ...taskData,
        due_date: taskData.due_date // Ya viene en formato YYYY-MM-DD
      }, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error en createTask:', error);
      throw new Error(error.response?.data?.message || 'Error al crear la tarea');
    }
  },

  updateTask: async (id, taskData) => {
    try {
      if (!id || typeof id !== 'number') {
        throw new Error('ID inválido para actualizar la tarea');
      }
  
      if (!taskData || typeof taskData !== 'object' || Array.isArray(taskData)) {
        throw new Error('Datos de tarea inválidos');
      }
  
      const today = new Date().toLocaleDateString('en-CA'); // Usa formato YYYY-MM-DD
      if (taskData.due_date && taskData.due_date < today) {
        throw new Error('La fecha de vencimiento no puede ser anterior a hoy');
      }
  
      const config = getAuthHeaders();
      const response = await axios.put(`${API_URL}/tasks/${id}`, {
        ...taskData,
        due_date: taskData.due_date // Ya viene en formato YYYY-MM-DD
      }, config);
  
      if (response.status !== 200) {
        throw new Error(`Error al actualizar la tarea, código de estado: ${response.status}`);
      }
  
      return response.data.task;
    } catch (error) {
      console.error('Error en updateTask:', error.response ? error.response.data : error.message);
      throw new Error(error.response?.data?.message || 'Error al actualizar la tarea');
    }
  },  

  updateTaskStatus: async (id, status) => {
    try {
      const config = getAuthHeaders();
      console.log(`Actualizando estado de la tarea ${id} a:`, status);

      const response = await axios.put(`${API_URL}/tasks/${id}/status`, { status }, config);

      console.log('Respuesta del servidor en updateTaskStatus:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error en updateTaskStatus:', error.response?.data || error);
      throw new Error(error.response?.data?.message || 'Error al actualizar el estado de la tarea');
    }
  },

  deleteTask: async (id) => {
    try {
      const config = getAuthHeaders();
      console.log(`Eliminando tarea con ID: ${id}`);

      const response = await axios.delete(`${API_URL}/tasks/${id}`, config);

      console.log('Respuesta del servidor en deleteTask:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error en deleteTask:', error.response?.data || error);
      throw new Error(error.response?.data?.message || 'Error al eliminar la tarea');
    }
  },
};

export default taskService;
