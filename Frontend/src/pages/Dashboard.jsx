import React, { useEffect } from 'react';
import { useTasks } from '../context/TaskContext';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ListTodo, 
  TrendingUp, 
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const Dashboard = () => {
  const { stats, fetchStats, loading } = useTasks();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const statCards = [
    {
      title: 'Total Tasks',
      value: stats.total || 0,
      icon: <ListTodo size={24} />,
      color: 'var(--accent)',
      bg: 'var(--accent-light)'
    },
    {
      title: 'Completed',
      value: stats.completed || 0,
      icon: <CheckCircle2 size={24} />,
      color: 'var(--success)',
      bg: 'var(--success-bg)'
    },
    {
      title: 'In Progress',
      value: stats.inProgress || 0,
      icon: <TrendingUp size={24} />,
      color: 'var(--info)',
      bg: 'var(--info-bg)'
    },
    {
      title: 'Pending',
      value: stats.pending || 0,
      icon: <Clock size={24} />,
      color: 'var(--status-pending)',
      bg: 'rgba(100, 116, 139, 0.1)'
    },
    {
      title: 'Overdue',
      value: stats.overdue || 0,
      icon: <AlertCircle size={24} />,
      color: 'var(--danger)',
      bg: 'var(--danger-bg)'
    }
  ];

  const statusData = {
    labels: ['Completed', 'In Progress', 'Pending'],
    datasets: [
      {
        data: [stats.completed || 0, stats.inProgress || 0, stats.pending || 0],
        backgroundColor: ['#10b981', '#3b82f6', '#64748b'],
        borderWidth: 0,
      },
    ],
  };

  const priorityData = {
    labels: ['High', 'Medium', 'Low'],
    datasets: [
      {
        label: 'Tasks by Priority',
        data: [stats.highPriority || 0, stats.mediumPriority || 0, stats.lowPriority || 0],
        backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
        borderRadius: 4,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: 'rgba(150, 150, 150, 0.1)' } },
      x: { grid: { display: false } }
    }
  };

  return (
    <div className="dashboard">
      <div className="card" style={{ marginBottom: '28px', background: 'linear-gradient(135deg, var(--accent), #a78bfa)', color: 'white', border: 'none', boxShadow: '0 10px 25px rgba(99, 102, 241, 0.3)', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px', letterSpacing: '-0.5px' }}>Welcome back! 👋</h1>
          <p style={{ opacity: 0.9, fontSize: '15px' }}>Here's an overview of your tasks and productivity today.</p>
        </div>
        <div style={{ position: 'absolute', top: '-50%', right: '-5%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '10%', width: '150px', height: '150px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
      </div>

      <div className="stats-grid">
        {statCards.map((stat, index) => (
          <div className="stat-card" key={index} style={{ '--stat-color': stat.color }}>
            <div className="stat-icon" style={{ background: stat.bg, color: stat.color }}>
              {stat.icon}
            </div>
            <div className="stat-info">
              <div className="stat-value">{loading ? '...' : stat.value}</div>
              <div className="stat-label">{stat.title}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '28px' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', alignSelf: 'flex-start' }}>Tasks by Status</h2>
          <div style={{ width: '250px', height: '250px' }}>
            <Pie data={statusData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>Tasks by Priority</h2>
          <div style={{ flex: 1, minHeight: '250px' }}>
            <Bar data={priorityData} options={barOptions} />
          </div>
        </div>
      </div>

     <div
  className="card"
  style={{
    padding: '32px',
    textAlign: 'center',
    marginTop: '40px'
  }}
>
  <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
    Ready to conquer the day?
  </h2>

  <p
    style={{
      color: 'var(--text-secondary)',
      marginBottom: '24px'
    }}
  >
    You have {stats.pending + stats.inProgress} active tasks waiting for you.
  </p>

  <Link
    to="/tasks"
    className="badge badge-priority-low"
    style={{
      display: 'inline-flex',
      padding: '10px 20px',
      fontSize: '14px',
      borderRadius: '8px',
      textDecoration: 'none'
    }}
  >
    View Tasks <ArrowRight size={16} />
  </Link>
</div>
    </div>
  );
};

export default Dashboard;
