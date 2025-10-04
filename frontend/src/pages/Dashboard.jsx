import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchProfile,
  fetchTasks,
  addTask,
  updateTask,
  deleteTask,
} from "../services/api";
import { useAuth } from "../components/AuthProvider";
import { FiEdit, FiTrash2, FiLogOut, FiSearch, FiMenu } from "react-icons/fi";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ title: "", description: "", completed: false });
  const [editTaskId, setEditTaskId] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); 
  const [loading, setLoading] = useState(true);
  const [taskError, setTaskError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false); 

  useEffect(() => {
    if (!user) return;
    const getProfile = async () => {
      try {
        setLoading(true);
        const res = await fetchProfile();
        setProfile(res.data.user);
      } catch (err) {
        console.error("Error fetching profile:", err);
        logout();
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    getProfile();
  }, [user]);

  const loadTasks = async () => {
    try {
      const res = await fetchTasks();
      const tasksWithCompleted = res.data.map((t) => ({ ...t, completed: t.completed || false }));
      setTasks(tasksWithCompleted);
      setTaskError("");
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setTaskError("Failed to load tasks");
    }
  };

  useEffect(() => {
    if (user) loadTasks();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) {
      setTaskError("Task title is required");
      return;
    }
    try {
      if (editTaskId) {
        await updateTask(editTaskId, newTask);
      } else {
        await addTask(newTask);
      }
      setNewTask({ title: "", description: "", completed: false });
      setEditTaskId(null);
      setTaskError("");
      loadTasks();
    } catch (err) {
      console.error("Task save error:", err);
      setTaskError(err.response?.data?.message || "Database insert/update error");
    }
  };

  const handleEdit = (task) => {
    setEditTaskId(task.id);
    setNewTask({ title: task.title, description: task.description, completed: task.completed });
  };

  const handleDelete = async (id) => {
    try {
      await deleteTask(id);
      loadTasks();
    } catch (err) {
      console.error("Task delete error:", err);
      setTaskError(err.response?.data?.message || "Failed to delete task");
    }
  };

  const toggleCompletion = async (task) => {
    try {
      await updateTask(task.id, { ...task, completed: !task.completed });
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t))
      );
    } catch (err) {
      console.error("Toggle completion error:", err);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.description.toLowerCase().includes(search.toLowerCase());
    if (filter === "pending") return matchesSearch && !task.completed;
    if (filter === "completed") return matchesSearch && task.completed;
    return matchesSearch;
  });

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const newTasks = Array.from(tasks);
    const [movedTask] = newTasks.splice(result.source.index, 1);
    newTasks.splice(result.destination.index, 0, movedTask);
    setTasks(newTasks);
  };

  if (!user) return <p className="p-6 text-center">Please login to access Dashboard</p>;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      <div className="md:hidden flex justify-between items-center p-4 bg-white shadow">
        <h2 className="text-xl font-bold text-gray-800">Dashboard</h2>
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>
          <FiMenu className="text-2xl" />
        </button>
      </div>

      <aside
        className={`bg-white shadow-lg p-6 flex flex-col justify-between mb-4 md:mb-0
          w-full md:w-64
          ${sidebarOpen ? "block" : "hidden"} md:block
        `}
      >
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6 md:block hidden">My Dashboard</h2>
          {profile && (
            <div className="mb-6 p-4 bg-gray-100 rounded-2xl shadow-sm text-center">
              <h3 className="text-lg font-semibold text-gray-700">{profile.name}</h3>
              <p className="text-gray-500 text-sm">{profile.email}</p>
            </div>
          )}

          <div className="space-y-3">
            <div className="bg-blue-100 p-3 rounded-lg shadow text-center">
              <p className="text-gray-700 font-semibold">Total Tasks</p>
              <p className="text-2xl font-bold text-blue-600">{totalTasks}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg shadow text-center">
              <p className="text-gray-700 font-semibold">Completed</p>
              <p className="text-2xl font-bold text-green-600">{completedTasks}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg shadow text-center">
              <p className="text-gray-700 font-semibold">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingTasks}</p>
            </div>

            <div className="mt-4">
              <p className="text-gray-700 font-semibold mb-1">Completion Rate</p>
              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-4 bg-gradient-to-r from-green-400 to-teal-500"
                  style={{ width: `${completionRate}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-1">{completionRate}% Completed</p>
            </div>

            <div className="mt-6 space-y-2">
              <button
  onClick={() =>
    setTasks((prev) => {
      const allCompleted = prev.every((t) => t.completed);
      return prev.map((t) => ({ ...t, completed: !allCompleted }));
    })
  }
  className="w-full py-2 rounded-lg text-white transition-colors"
  style={{
    backgroundColor: tasks.every((t) => t.completed) ? "#f87171" : "#22c55e", // red if all completed, green otherwise
  }}
>
  {tasks.every((t) => t.completed) ? "Unmark All" : "Mark All"}
</button>

              <button
                onClick={async () => {
                  try {
                    const completedTasks = tasks.filter((t) => t.completed);
                    await Promise.all(completedTasks.map((t) => deleteTask(t.id)));
                    loadTasks();
                  } catch (err) {
                    console.error("Error deleting completed tasks:", err);
                    setTaskError("Failed to delete completed tasks");
                  }
                }}
                className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition mt-6"
        >
          Logout
        </button>
      </aside>

      <main className="flex-1 p-6 md:p-10">

        <form onSubmit={handleSubmit} className="mb-6 flex flex-col md:flex-row gap-3">
          <input
            type="text"
            placeholder="Task Title"
            className="flex-1 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
          />
          <input
            type="text"
            placeholder="Task Description"
            className="flex-1 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
          />
          <button
            type="submit"
            className="w-full md:w-auto bg-green-500 text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-green-600 transition"
          >
            {editTaskId ? "Update Task" : "Add Task"}
          </button>
        </form>
        {taskError && <p className="text-red-500 mb-4">{taskError}</p>}

        <div className="relative w-full mb-4">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            className="w-full pl-10 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              filter === "all" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            All Tasks
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              filter === "pending" ? "bg-yellow-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Pending Tasks
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              filter === "completed" ? "bg-green-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Completed Tasks
          </button>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="tasks">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                {filteredTasks.length === 0 && <p className="text-gray-500">No tasks found</p>}
                {filteredTasks.map((task, index) => (
                  <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-lg shadow-sm bg-white hover:shadow-md transition gap-3"
                      >
                        <div className="flex items-center gap-3 w-full md:w-auto">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => toggleCompletion(task)}
                            className="w-5 h-5 rounded border-gray-400"
                          />
                          <div>
                            <h3 className={`font-semibold ${task.completed ? "line-through text-gray-400" : ""}`}>
                              {task.title}
                            </h3>
                            <p className={`text-gray-600 ${task.completed ? "line-through" : ""}`}>{task.description}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-2 md:mt-0">
                          <button
                            onClick={() => handleEdit(task)}
                            className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition flex items-center gap-1"
                          >
                            <FiEdit /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(task.id)}
                            className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition flex items-center gap-1"
                          >
                            <FiTrash2 /> Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </main>
    </div>
  );
}