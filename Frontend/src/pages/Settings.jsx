import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { User, Lock, Moon, Sun, Save } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Settings = () => {
    const { user, updateProfile, updatePassword } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { addToast } = useToast();

    const [profileData, setProfileData] = useState({
        name: user?.name || '',
        email: user?.email || '',
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [isProfileUpdating, setIsProfileUpdating] = useState(false);
    const [isPasswordUpdating, setIsPasswordUpdating] = useState(false);

    const handleProfileChange = (e) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setIsProfileUpdating(true);
        await updateProfile(profileData);
        setIsProfileUpdating(false);
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            return addToast('New passwords do not match', 'error');
        }
        if (passwordData.newPassword.length < 6) {
            return addToast('Password must be at least 6 characters long', 'error');
        }
        
        setIsPasswordUpdating(true);
        const success = await updatePassword({
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword
        });
        
        if (success) {
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        }
        setIsPasswordUpdating(false);
    };

    return (
        <div className="settings-page" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
            <div className="page-header" style={{ marginBottom: '32px' }}>
                <h1 className="page-title">Settings</h1>
                <p className="page-subtitle">Manage your account preferences and settings.</p>
            </div>

            <div style={{ display: 'grid', gap: '32px' }}>
                {/* Profile Settings */}
                <div className="card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <User style={{ color: 'var(--accent)' }} size={24} />
                        <h2 style={{ fontSize: '18px', fontWeight: '600' }}>Profile Information</h2>
                    </div>
                    <form onSubmit={handleProfileSubmit}>
                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Full Name</label>
                            <input
                                type="text"
                                name="name"
                                value={profileData.name}
                                onChange={handleProfileChange}
                                className="form-input"
                                placeholder="Enter your full name"
                                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-primary)' }}
                                required
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: '20px' }}>
                            <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={profileData.email}
                                onChange={handleProfileChange}
                                className="form-input"
                                placeholder="Enter your email address"
                                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-primary)' }}
                                required
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={isProfileUpdating}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--accent)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '500', cursor: isProfileUpdating ? 'not-allowed' : 'pointer', opacity: isProfileUpdating ? 0.7 : 1 }}
                        >
                            <Save size={18} />
                            {isProfileUpdating ? 'Saving...' : 'Save Changes'}
                        </button>
                    </form>
                </div>

                {/* Password Settings */}
                <div className="card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <Lock style={{ color: 'var(--accent)' }} size={24} />
                        <h2 style={{ fontSize: '18px', fontWeight: '600' }}>Change Password</h2>
                    </div>
                    <form onSubmit={handlePasswordSubmit}>
                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Current Password</label>
                            <input
                                type="password"
                                name="currentPassword"
                                value={passwordData.currentPassword}
                                onChange={handlePasswordChange}
                                className="form-input"
                                placeholder="Enter current password"
                                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-primary)' }}
                                required
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>New Password</label>
                            <input
                                type="password"
                                name="newPassword"
                                value={passwordData.newPassword}
                                onChange={handlePasswordChange}
                                className="form-input"
                                placeholder="Enter new password"
                                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-primary)' }}
                                required
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: '20px' }}>
                            <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Confirm New Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordChange}
                                className="form-input"
                                placeholder="Confirm new password"
                                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-primary)' }}
                                required
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={isPasswordUpdating}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--accent)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '500', cursor: isPasswordUpdating ? 'not-allowed' : 'pointer', opacity: isPasswordUpdating ? 0.7 : 1 }}
                        >
                            <Lock size={18} />
                            {isPasswordUpdating ? 'Updating...' : 'Update Password'}
                        </button>
                    </form>
                </div>

                {/* Preferences */}
                <div className="card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        {theme === 'dark' ? <Moon style={{ color: 'var(--accent)' }} size={24} /> : <Sun style={{ color: 'var(--accent)' }} size={24} />}
                        <h2 style={{ fontSize: '18px', fontWeight: '600' }}>Preferences</h2>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div>
                            <div style={{ fontWeight: '500', marginBottom: '4px' }}>Dark Mode</div>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Toggle between light and dark theme</div>
                        </div>
                        <button 
                            onClick={toggleTheme}
                            style={{ 
                                width: '48px', 
                                height: '24px', 
                                borderRadius: '12px', 
                                background: theme === 'dark' ? 'var(--accent)' : 'var(--border-color)', 
                                border: 'none', 
                                position: 'relative', 
                                cursor: 'pointer',
                                transition: 'background 0.3s'
                            }}
                        >
                            <div style={{ 
                                width: '20px', 
                                height: '20px', 
                                borderRadius: '50%', 
                                background: 'white', 
                                position: 'absolute', 
                                top: '2px', 
                                left: theme === 'dark' ? '26px' : '2px',
                                transition: 'left 0.3s',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
