import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import AgendaPage from './pages/AgendaPage';
import KanbanPage from './pages/KanbanPage';
import MindMapPage from './pages/MindMapPage';
import FinancePage from './pages/FinancePage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import TaskModal from './components/TaskModal';
import GoalModal from './components/GoalModal';
import TransactionModal from './components/TransactionModal';
import NotificationDrawer from './components/NotificationDrawer';
import api from './services/api';

export function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('life_os_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [lifeLevel, setLifeLevel] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [financeSummary, setFinanceSummary] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [activeTask, setActiveTask] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const [activeGoal, setActiveGoal] = useState(null);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isNotificationsDrawerOpen, setIsNotificationsDrawerOpen] = useState(false);

  // Carregar dados gerais do sistema
  const refreshAllData = async () => {
    if (!user) return;
    try {
      const [levelRes, tasksRes, finRes, txRes, goalsRes] = await Promise.allSettled([
        api.lifeLevel.get(),
        api.tasks.list(),
        api.finance.getSummary(),
        api.finance.getTransactions(),
        api.goals.list()
      ]);

      if (levelRes.status === 'fulfilled') setLifeLevel(levelRes.value);
      if (tasksRes.status === 'fulfilled') setTasks(tasksRes.value.tasks || []);
      if (finRes.status === 'fulfilled') setFinanceSummary(finRes.value || {});
      if (txRes.status === 'fulfilled') setTransactions(txRes.value.transactions || []);
      if (goalsRes.status === 'fulfilled') {
        setGoals(goalsRes.value.goals || []);
        setLinks(goalsRes.value.links || []);
      }
    } catch (err) {
      console.error('Erro ao atualizar dados:', err);
    }
  };

  useEffect(() => {
    if (user) {
      refreshAllData();
    }
  }, [user]);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('life_os_token');
    localStorage.removeItem('life_os_user');
    setUser(null);
  };

  if (!user) {
    return <LoginPage onLoginSuccess={(u) => setUser(u)} />;
  }

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col font-sans">
      {/* Header com HUD do Nível de Vida */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lifeLevel={lifeLevel}
        onOpenNotifications={() => setIsNotificationsDrawerOpen(true)}
        onLogout={handleLogout}
        user={user}
      />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'dashboard' && (
          <DashboardPage
            lifeLevel={lifeLevel}
            tasks={tasks}
            financeSummary={financeSummary}
            goals={goals}
            onRefresh={refreshAllData}
            onOpenTaskModal={(t) => {
              setActiveTask(t);
              setIsTaskModalOpen(true);
            }}
            onOpenGoalModal={(g) => {
              setActiveGoal(g);
              setIsGoalModalOpen(true);
            }}
            onOpenTransactionModal={() => setIsTransactionModalOpen(true)}
            onSelectTab={setActiveTab}
          />
        )}

        {activeTab === 'agenda' && (
          <AgendaPage
            tasks={tasks}
            onOpenTaskModal={(t) => {
              setActiveTask(t);
              setIsTaskModalOpen(true);
            }}
            onTaskUpdated={refreshAllData}
          />
        )}

        {activeTab === 'kanban' && (
          <KanbanPage
            tasks={tasks}
            onOpenTaskModal={(t) => {
              setActiveTask(t);
              setIsTaskModalOpen(true);
            }}
            onTaskUpdated={refreshAllData}
            onTriggerWhatsApp={() => setIsNotificationsDrawerOpen(true)}
          />
        )}

        {(activeTab === 'mind-map' || activeTab === 'life-builder') && (
          <MindMapPage
            onOpenTaskModal={() => {
              setActiveTask(null);
              setIsTaskModalOpen(true);
            }}
          />
        )}

        {activeTab === 'finance' && (
          <FinancePage
            financeSummary={financeSummary}
            transactions={transactions}
            goals={goals}
            onOpenTransactionModal={() => setIsTransactionModalOpen(true)}
            onRefresh={refreshAllData}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsPage
            onOpenNotifications={() => setIsNotificationsDrawerOpen(true)}
          />
        )}
      </main>

      {/* Modal de Atividade (Trello Style com micro-atividades, anexos e WhatsApp) */}
      <TaskModal
        task={activeTask}
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setActiveTask(null);
        }}
        onTaskUpdated={refreshAllData}
      />

      {/* Modal de Meta de Vida */}
      <GoalModal
        goal={activeGoal}
        isOpen={isGoalModalOpen}
        onClose={() => {
          setIsGoalModalOpen(false);
          setActiveGoal(null);
        }}
        onGoalSaved={refreshAllData}
      />

      {/* Modal de Transação Financeira */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onTransactionSaved={refreshAllData}
        goals={goals}
      />

      {/* Gaveta de Notificações WhatsApp Plugsend */}
      <NotificationDrawer
        isOpen={isNotificationsDrawerOpen}
        onClose={() => setIsNotificationsDrawerOpen(false)}
        onOpenSettings={() => setActiveTab('settings')}
      />
    </div>
  );
}

export default App;
