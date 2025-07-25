import { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import "./styles/TaskTable.css";
import TaskDetailModal from '../TaskDetailModal.jsx';
import { useAuth } from '../../context/authContext.jsx';
import { Listbox } from '@headlessui/react';
import { motion } from "framer-motion";
import TaskActionsBar from './TaskActionsBar.jsx';
import TaskFilterControls from './components/TaskFilterControls.jsx';
import TaskViewModeToggle from './components/TaskViewModeToggle.jsx';
import TaskTableHeader from './components/TaskTableHeader.jsx';
import TaskTableRow from './components/TaskTableRow.jsx';
import TaskEmptyState from './components/TaskEmptyState.jsx';
import { Search, User, Building2, Layout, Calendar, Eye, Pencil, Trash2 } from 'lucide-react';
import { formatDate, sortTasksByDueDate } from '../../utils/dateUtils';

const TaskTable = ({ tasks, onDeleteTask, onEditTask, onStatusChange }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const searchOptions = [
    { value: 'all', icon: <Search size={16} color="#888" />, label: 'Buscar en todo' },
    { value: 'user', icon: <User size={16} color="#3b82f6" />, label: 'Usuario' },
    { value: 'company', icon: <Building2 size={16} color="#8b5cf6" />, label: 'Empresa' },
    { value: 'area', icon: <Layout size={16} color="#10b981" />, label: 'Área' },
    { value: 'date', icon: <Calendar size={16} color="#ef4444" />, label: 'Fecha' },
  ];

  const [sortConfig, setSortConfig] = useState({ key: 'dueDate', direction: 'asc' });

  const matchesField = (field, query) => {
    if (!query) return true;
    const queryLower = query.toLowerCase();
    return field?.toLowerCase().includes(queryLower);
  };

  const matchesDateRange = (task) => {
    if (!dateRange.startDate && !dateRange.endDate) return true;

    const taskDate = new Date(task.createdAt);

    if (dateRange.startDate) {
      const startDate = new Date(dateRange.startDate);
      if (taskDate < startDate) return false;
    }

    if (dateRange.endDate) {
      const endDate = new Date(dateRange.endDate);
      if (taskDate > endDate) return false;
    }

    return true;
  };

  const [selectedTask, setSelectedTask] = useState(null);
  const [expandedTask, setExpandedTask] = useState(null);
  const [viewMode, setViewMode] = useState('cards');
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchBy, setSearchBy] = useState(searchOptions[0]);
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null
  });

  const handleSelectTask = (taskId) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
    setSelectAll(false);
  };

  const handleSelectAll = () => {
    const newSelected = new Set();
    if (selectAll) {
      setSelectedTasks(newSelected);
    } else {
      filteredTasks.forEach(task => newSelected.add(task.id));
      setSelectedTasks(newSelected);
    }
    setSelectAll(!selectAll);
  };

  const handleDeleteSelected = () => {
    // Confirmation is now handled in TaskActionsBar
    const taskIdsArray = Array.from(selectedTasks);
    taskIdsArray.forEach(async (taskId) => {
      try {
        await onDeleteTask(taskId);
      } catch (error) {
        console.error(`Error al eliminar tarea ${taskId}:`, error);
      }
    });
    setSelectedTasks(new Set());
    setSelectAll(false);
  };

  const handleChangeStatusSelected = (newStatus) => {
    // Confirmation is now handled in TaskActionsBar
    selectedTasks.forEach(taskId => onStatusChange(taskId, newStatus));
    setSelectedTasks(new Set());
    setSelectAll(false);
    // selectedStatus state is removed, its equivalent is local to TaskActionsBar
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedTasks = useMemo(() => {
    if (!Array.isArray(tasks)) return [];
    
    let sorted = [...tasks];
    
    // Apply date sorting
    if (sortConfig.key === 'dueDate' || sortConfig.key === 'createdAt') {
      sorted = sortTasksByDueDate(sorted, sortConfig.direction);
    } else if (sortConfig.key) {
      sorted.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return sorted;
  }, [tasks, sortConfig]);

  const filteredTasks = useMemo(() => {
    if (!Array.isArray(sortedTasks)) return [];
    
    return sortedTasks.filter(task => {
      const matchesStatus = filterStatus === 'all' || task.status === filterStatus;

      let matchesSearch = false;

      if (searchBy.value === 'all') {
        matchesSearch = matchesField(task.title, searchQuery) ||
          matchesField(task.description, searchQuery) ||
          matchesField(task.assignedUser?.name, searchQuery) ||
          matchesField(task.company?.name, searchQuery) ||
          matchesField(task.Areas?.nombre_area, searchQuery);
      } else if (searchBy.value === 'user') {
        matchesSearch = matchesField(task.assignedUser?.name, searchQuery);
      } else if (searchBy.value === 'company') {
        matchesSearch = matchesField(task.company?.name, searchQuery);
      } else if (searchBy.value === 'area') {
        matchesSearch = matchesField(task.Areas?.nombre_area, searchQuery);
      } else if (searchBy.value === 'date') {
        matchesSearch = matchesDateRange(task);
      }

      return matchesStatus && matchesSearch;
    });
  }, [sortedTasks, filterStatus, searchBy, searchQuery, dateRange]);

  const activeTasksCount = filteredTasks.filter((task) => task.status === 'in_progress').length;
  const completedTasksCount = filteredTasks.filter((task) => task.status === 'completed').length;

  const formatDate = (dateString) => {
    return formatDate(dateString);
          const timeOnly = dateParts[1];
          const [year, month, day] = dateOnly.split('-');
          const [hour, minute] = timeOnly.split(':');
          return `${day}/${month}/${year} ${hour}:${minute}`;
        }

        const datePartsDash = dateString.split('-');
        if (datePartsDash.length === 3) {
          return `${datePartsDash[2]}/${datePartsDash[1]}/${datePartsDash[0]}`;
        }
      }

      return '-';
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return '-';
    }
  };

  const getStatusClass = (status) => {
    const statusClasses = {
      in_progress: 'status-in-progress',
      completed: 'status-completed',
    };
    return `status-badge ${statusClasses[status] || ''}`;
  };

  const getRowClass = (status) => {
    return status === 'completed' ? 'completed-task' : '';
  };
  
  const handleRowClick = (taskId) => {
    setExpandedTask(expandedTask === taskId ? null : taskId);
  };
    }

    return '-';
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return '-';
  }
};

const getStatusClass = (status) => {
  const statusClasses = {
    in_progress: 'status-in-progress',
    completed: 'status-completed',
  };
  return `status-badge ${statusClasses[status] || ''}`;
};

  const activeTasksCount = filteredTasks.filter((task) => task.status === 'in_progress').length;
  const completedTasksCount = filteredTasks.filter((task) => task.status === 'completed').length;

return (
  <div className="task-tables-container">
    <div className="filters-container" style={{ marginBottom: '15px' }}>
    </div>

    <div className="view-mode-toggle">
      {isAdmin && (
        <div className="task-counters" style={{ marginBottom: '10px', paddingRight: '10px' }}>
          <span className="counter in-progress-counter" style={{ paddingRight: '10px' }}>
            <span className='name-title'>Total</span>
            <div className='counter-count'>
              <span className='counter-number'>{filteredTasks.length}</span>
            </div>
          </span>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <TaskFilterControls
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          searchBy={searchBy}
          setSearchBy={setSearchBy}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          dateRange={dateRange}
          setDateRange={setDateRange}
        />
        <TaskViewModeToggle
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
      </div>
    </div>

    <div className="task-section">
      {selectedTasks.size > 0 && (
        <TaskActionsBar
          selectedTasksCount={selectedTasks.size}
          onDeleteSelected={handleDeleteSelected}
          onChangeStatusSelected={handleChangeStatusSelected}
        // isAdmin={isAdmin} // Pass if needed by TaskActionsBar
        />
      )}
      <div className="task-table-container">
        {filteredTasks.length === 0 ? (
          <TaskEmptyState tasks={tasks} searchQuery={searchQuery} />
        ) : viewMode === 'table' ? (
          <div className="table-responsive">
            <motion.table className="task-table">
              <thead>
                <TaskTableHeader
                  sortConfig={sortConfig}
                  handleSort={handleSort}
                  isAdmin={isAdmin}
                  selectedTasks={selectedTasks}
                  selectedTasksCount={selectedTasks.size}
                  handleSelectAll={handleSelectAll}
                  handleDeleteSelected={handleDeleteSelected}
                  handleChangeStatusSelected={handleChangeStatusSelected}
                  viewMode={viewMode}
                />
              </thead>
              <tbody>
                {filteredTasks.map((task, index) => (
                  <TaskTableRow
                    key={task.id}
                    task={task}
                    selectedTasks={selectedTasks}
                    handleSelectTask={handleSelectTask}
                    expandedTask={expandedTask}
                    handleRowClick={handleRowClick}
                    onStatusChange={onStatusChange}
                    isAdmin={isAdmin}
                    onDeleteTask={onDeleteTask}
                    onEditTask={onEditTask}
                    formatDate={formatDate}
                    getStatusClass={getStatusClass}
                    getRowClass={getRowClass}
                    viewMode={viewMode}
                  />
                ))}
              </tbody>
            </motion.table>
          </div>
        ) : viewMode === 'list' ? (
          <div className="task-list-container">
            {filteredTasks.map((task, index) => (
              <motion.div
                key={task.id}
                className={`task-list-item ${getRowClass(task.status)} ${expandedTask === task.id ? 'expanded' : ''}`}
                onClick={() => handleRowClick(task.id)}
              >
                <div className="list-item-header">
                  <h3>{task.title}</h3>
                  <select
                    className={getStatusClass(task.status)}
                    value={task.status}
                    onChange={(e) => {
                      e.stopPropagation();
                      onStatusChange(task.id, e.target.value);
                    }}
                  >
                    <option value="in_progress">En Proceso</option>
                    <option value="completed">Completad</option>
                  </select>
                </div>
                <div className="list-item-content">
                  <div className="list-item-row">
                    <span className="label">Observación:</span>
                    <div className="task-observation">
                      <div
                        className="observation-content"
                        title={task.observation}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTask(task);
                        }}
                      >
                        {task.observation || '-'}
                      </div>
                      {expandedTask === task.id && task.observation && (
                        <div className="observation-expanded">{task.observation}</div>
                      )}
                    </div>
                  </div>
                  <div className="list-item-row">
                    <span className="label">Usuario:</span>
                    <span>{task.assignedUser?.name}</span>
                  </div>
                  <div className="list-item-row">
                    <span className="label">Empresa:</span>
                    <span>{task.company?.name}</span>
                  </div>
                  <div className="list-item-row">
                    <span className="label">Área:</span>
                    <span>{task.Areas?.nombre_area}</span>
                  </div>
                  <div className="list-item-row">
                    <span className="label">Fecha Creación:</span>
                    <span>{formatDate(task.createdAt)}</span>
                  </div>
                  <div className="list-item-row">
                    <span className="label">Fecha Límite:</span>
                    <span>{formatDate(task.dueDate)}</span>
                  </div>
                </div>
                {isAdmin && (
                  <div className="list-item-actions">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTask(task);
                      }}
                      className="detail-button"
                      title="Ver detalles"
                    >
                      <i className="fa-solid fa-eye"></i>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditTask(task);
                      }}
                      className="edit-button"
                      title="Editar tarea"
                    >
                      <i className="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(e, task)}
                      className="delete-button"
                      title="Eliminar tarea"
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="task-list-container">
            {/* Old bulk actions UI removed, TaskActionsBar is now used above */}
            <table className="task-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="select-all-checkbox"
                    />
                  </th>
                    <th>Título</th>
                  <th>Estado</th>
                  <th>Observación</th>
                  <th>Usuario</th>
                  <th>Empresa</th>
                  <th>Área</th>
                  <th>Fecha Creación</th>
                  <th>Fecha Límite</th>
                  {isAdmin && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task, index) => (
                  <motion.tr
                    key={task.id}
                    className={`task-card ${getRowClass(task.status)} ${expandedTask === task.id ? 'expanded' : ''}`}
                    onClick={() => handleRowClick(task.id)}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedTasks.has(task.id)}
                        onChange={() => handleSelectTask(task.id)}
                        className="task-checkbox"
                      />
                    </td>
                    <td>
                      <label>{task.title}</label>
                    </td>
                    <td>
                      <Listbox
                        value={task.status}
                        onChange={(value) => {
                          onStatusChange(task.id, value);
                        }}
                      >
                        <Listbox.Button className={getStatusClass(task.status)}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {task.status === 'in_progress' ? 'En Proceso' : task.status === 'completed' ? 'Completada' : ''}
                          </span>
                        </Listbox.Button>
                        <Listbox.Options className="listbox-options" style={{ position: 'absolute' }} unmount={false}>
                          <Listbox.Option value="in_progress" className="listbox-option">
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              En Proceso
                            </span>
                          </Listbox.Option>
                          <Listbox.Option value="completed" className="listbox-option">
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              Completada
                            </span>
                          </Listbox.Option>
                        </Listbox.Options>
                      </Listbox>
                    </td>
                    <td>
                      <div className="task-observation">
                        <div
                          className="observation-content"
                          title={task.observation}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTask(task);
                          }}
                        >
                          {task.observation || '-'}
                        </div>
                        {expandedTask === task.id && task.observation && (
                          <div className="observation-expanded">{task.observation}</div>
                        )}
                      </div>
                    </td>
                    <td>{task.assignedUser?.name}</td>
                    <td>{task.company?.name}</td>
                    <td>{task.Areas?.nombre_area}</td>
                    <td>{formatDate(task.createdAt)}</td>
                    <td>
                      {task.dueDate ? formatDate(task.dueDate) : '-'}
                    </td>
                    {isAdmin && (
                      <td>
                        <div className="task-list-actions">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTask(task);
                            }}
                            className="detail-button"
                            title="Ver detalles"
                          >
                            <Eye className="icon" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditTask(task);
                            }}
                            className="edit-button"
                            title="Editar tarea"
                          >
                            <Pencil className="icon" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(e, task)}
                            className="delete-button"
                            title="Eliminar tarea"
                          >
                            <Trash2 className="icon" />
                          </button>
                        </div>
                      </td>
                    )}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditTask(task);
                              }}
                              className="edit-button"
                              title="Editar tarea"
                            >
                              <Pencil className="icon" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteClick(e, task)}
                              className="delete-button"
                              title="Eliminar tarea"
                            >
                              <Trash2 className="icon" />
                            </button>
                          </div>
                        </td>
                      )}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedTask && (
        <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
};

TaskTable.propTypes = {
  tasks: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      title: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      observation: PropTypes.string,
      assignedUser: PropTypes.shape({
        name: PropTypes.string
      }),
      company: PropTypes.shape({
        name: PropTypes.string
      }),
      Areas: PropTypes.shape({
        nombre_area: PropTypes.string
      }),
      createdAt: PropTypes.string,
      dueDate: PropTypes.string
    })
  ).isRequired,
  onDeleteTask: PropTypes.func.isRequired,
  onEditTask: PropTypes.func.isRequired,
  onStatusChange: PropTypes.func.isRequired
};

export default TaskTable; 