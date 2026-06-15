import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BASE_URL from '../../url';
import './SocialMediaSettings.css';

const SocialMediaSettings = () => {
  const [configs, setConfigs] = useState({
    LinkedIn: {
      PlatformName: 'LinkedIn', AccessToken: '', ConnectionStatus: 'Not Configured', LastVerifiedDate: null
    },
    LinkedIn_Prophecy: {
      PlatformName: 'LinkedIn_Prophecy', ConnectionStatus: 'Not Configured', LastVerifiedDate: null
    },
    LinkedIn_Cognifyar: {
      PlatformName: 'LinkedIn_Cognifyar', ConnectionStatus: 'Not Configured', LastVerifiedDate: null
    },
    Instagram: {
      PlatformName: 'Instagram', ConnectionStatus: 'Not Configured', LastVerifiedDate: null
    },
    Facebook: {
      PlatformName: 'Facebook', ConnectionStatus: 'Not Configured', LastVerifiedDate: null
    }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [showLinkedInInput, setShowLinkedInInput] = useState(false);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/api/social/configs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success && response.data.data.length > 0) {
        const newConfigs = { ...configs };
        response.data.data.forEach(conf => {
          if (newConfigs[conf.PlatformName]) {
            newConfigs[conf.PlatformName] = { ...newConfigs[conf.PlatformName], ...conf, AccessToken: conf.AccessTokenEncrypted ? '********' : '' };
          }
        });
        setConfigs(newConfigs);
      }
    } catch (error) {
      console.error('Error fetching social media configs:', error);
      showMessage('error', 'Failed to load configurations.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (platform, field, value) => {
    setConfigs(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [field]: value
      }
    }));
  };

  const handleSave = async (platform) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const dataToSave = { ...configs[platform] };
      if (dataToSave.AccessToken === '********') delete dataToSave.AccessToken;

      await axios.post(`${BASE_URL}/api/social/config`, dataToSave, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      showMessage('success', `${platform.replace('_', ' ')} configuration saved successfully!`);
      handleChange(platform, 'ConnectionStatus', 'Connected');
      handleChange(platform, 'IsActive', 1);
      handleChange(platform, 'LastVerifiedDate', new Date().toISOString());
      if (platform === 'LinkedIn') setShowLinkedInInput(false);
    } catch (error) {
      console.error(`Error saving ${platform} config:`, error);
      showMessage('error', `Failed to save ${platform.replace('_', ' ')} configuration.`);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (platform) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`${BASE_URL}/api/social/config/${platform}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        showMessage('success', response.data.message);
        handleChange(platform, 'IsActive', response.data.isActive);
      }
    } catch (error) {
      console.error(`Error toggling ${platform} config:`, error);
      showMessage('error', `Failed to toggle ${platform.replace('_', ' ')} configuration.`);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const getStatusBadge = (status) => {
    let className = 'sms-status-badge ';
    if (status === 'Connected') className += 'sms-status-connected';
    else if (status === 'Not Configured') className += 'sms-status-pending';
    else className += 'sms-status-error';

    return <span className={className}>{status}</span>;
  };

  if (loading) return <div className="sms-loading">Loading settings...</div>;

  return (
    <div className="sms-container">
      <div className="sms-header">
        <h1>⚙️ Social Media Integrations</h1>
        <p>Manage your connections for automated job posting</p>
      </div>

      {message && (
        <div className={`sms-alert sms-alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="sms-cards-grid">
        {/* LinkedIn Personal Card */}
        <div className="sms-card sms-linkedin-card">
          <div className="sms-card-header">
            <div className="sms-card-title">
              <i className="fab fa-linkedin"></i> LinkedIn (Personal)
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {getStatusBadge(configs.LinkedIn.ConnectionStatus)}
              {configs.LinkedIn.ConnectionStatus === 'Connected' && (
                <button 
                  onClick={() => handleToggle('LinkedIn')}
                  className={`sms-toggle-btn ${configs.LinkedIn.IsActive ? 'sms-toggle-disable' : 'sms-toggle-enable'}`}
                  title={configs.LinkedIn.IsActive ? "Pause automated posting" : "Resume automated posting"}
                >
                  {configs.LinkedIn.IsActive ? 'Disable' : 'Enable'}
                </button>
              )}
            </div>
          </div>
          <div className="sms-card-body">
            {configs.LinkedIn.ConnectionStatus === 'Connected' && !showLinkedInInput ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#666' }}>
                <p style={{ fontSize: '16px', lineHeight: '1.5', marginBottom: '15px' }}>
                  Your personal LinkedIn account is successfully connected.
                </p>
                <button 
                  className="sms-save-btn sms-linkedin-btn" 
                  style={{ width: 'auto', padding: '8px 20px', backgroundColor: '#e0e0e0', color: '#333' }}
                  onClick={() => setShowLinkedInInput(true)}
                >
                  Update Access Token
                </button>
                {configs.LinkedIn.LastVerifiedDate && <div className="sms-last-verified" style={{ marginTop: '15px' }}>Last verified: {new Date(configs.LinkedIn.LastVerifiedDate).toLocaleString()}</div>}
              </div>
            ) : (
              <>
                <div className="sms-field-group">
                  <label className="sms-label">Personal Access Token</label>
                  <input className="sms-input" type="password" value={configs.LinkedIn.AccessToken} onChange={(e) => handleChange('LinkedIn', 'AccessToken', e.target.value)} placeholder="Enter Access Token" />
                </div>
                <button className="sms-save-btn sms-linkedin-btn" onClick={() => handleSave('LinkedIn')} disabled={saving}>
                  {saving ? 'Saving...' : 'Save LinkedIn Configuration'}
                </button>
                <div style={{ marginTop: '10px', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '20px', alignItems: 'center' }}>
                  <a href="https://prophecytechscom-my.sharepoint.com/:w:/g/personal/prabhu_prophecytechs_com/IQAZGR0msRIfQK8KeghLW_iYAaPOq4VRuvawMupQ5ggpLLM?e=kacLGd" target="_blank" rel="noopener noreferrer" style={{ color: '#0077b5', fontSize: '13px', textDecoration: 'underline' }}>
                    Instructions for Access Token
                  </a>
                  {configs.LinkedIn.ConnectionStatus === 'Connected' && (
                    <span style={{ color: '#666', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setShowLinkedInInput(false)}>
                      Cancel
                    </span>
                  )}
                </div>
                {configs.LinkedIn.LastVerifiedDate && !showLinkedInInput && <div className="sms-last-verified">Last verified: {new Date(configs.LinkedIn.LastVerifiedDate).toLocaleString()}</div>}
              </>
            )}
          </div>
        </div>

        {/* LinkedIn Prophecy Card */}
        <div className="sms-card sms-linkedin-card">
          <div className="sms-card-header">
            <div className="sms-card-title">
              <i className="fab fa-linkedin"></i> LinkedIn (Prophecy)
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {getStatusBadge(configs.LinkedIn_Prophecy.ConnectionStatus)}
              <button 
                onClick={() => handleToggle('LinkedIn_Prophecy')}
                className={`sms-toggle-btn ${configs.LinkedIn_Prophecy.IsActive ? 'sms-toggle-disable' : 'sms-toggle-enable'}`}
                title={configs.LinkedIn_Prophecy.IsActive ? "Pause automated posting" : "Resume automated posting"}
              >
                {configs.LinkedIn_Prophecy.IsActive ? 'Disable' : 'Enable'}
              </button>
            </div>
          </div>
          <div className="sms-card-body" style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
            <p style={{ fontSize: '16px', lineHeight: '1.5' }}>
              The Prophecy Technologies LinkedIn page is globally configured by the administrator.<br/><br/>
              Simply <b>Enable</b> this integration to post your jobs to the official company page.
            </p>
          </div>
        </div>

        {/* LinkedIn Cognifyar Card */}
        <div className="sms-card sms-linkedin-card">
          <div className="sms-card-header">
            <div className="sms-card-title">
              <i className="fab fa-linkedin"></i> LinkedIn (Cognifyar)
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {getStatusBadge(configs.LinkedIn_Cognifyar.ConnectionStatus)}
              <button 
                onClick={() => handleToggle('LinkedIn_Cognifyar')}
                className={`sms-toggle-btn ${configs.LinkedIn_Cognifyar.IsActive ? 'sms-toggle-disable' : 'sms-toggle-enable'}`}
                title={configs.LinkedIn_Cognifyar.IsActive ? "Pause automated posting" : "Resume automated posting"}
              >
                {configs.LinkedIn_Cognifyar.IsActive ? 'Disable' : 'Enable'}
              </button>
            </div>
          </div>
          <div className="sms-card-body" style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
            <p style={{ fontSize: '16px', lineHeight: '1.5' }}>
              The Cognifyar LinkedIn page is globally configured by the administrator.<br/><br/>
              Simply <b>Enable</b> this integration to post your jobs to the official company page.
            </p>
          </div>
        </div>

        {/* Instagram Card */}
        <div className="sms-card sms-instagram-card">
          <div className="sms-card-header">
            <div className="sms-card-title">
              <i className="fab fa-instagram"></i> Instagram
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {getStatusBadge(configs.Instagram.ConnectionStatus)}
              <button 
                onClick={() => handleToggle('Instagram')}
                className={`sms-toggle-btn ${configs.Instagram.IsActive ? 'sms-toggle-disable' : 'sms-toggle-enable'}`}
                title={configs.Instagram.IsActive ? "Pause automated posting" : "Resume automated posting"}
              >
                {configs.Instagram.IsActive ? 'Disable' : 'Enable'}
              </button>
            </div>
          </div>
          <div className="sms-card-body" style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
            <p style={{ fontSize: '16px', lineHeight: '1.5' }}>
              The Prophecy Technologies Instagram account is globally configured by the administrator.<br/><br/>
              Simply <b>Enable</b> this integration to post your jobs to the official company page.
            </p>
          </div>
        </div>

        {/* Facebook Card */}
        <div className="sms-card sms-facebook-card">
          <div className="sms-card-header">
            <div className="sms-card-title">
              <i className="fab fa-facebook"></i> Facebook
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {getStatusBadge(configs.Facebook.ConnectionStatus)}
              <button 
                onClick={() => handleToggle('Facebook')}
                className={`sms-toggle-btn ${configs.Facebook.IsActive ? 'sms-toggle-disable' : 'sms-toggle-enable'}`}
                title={configs.Facebook.IsActive ? "Pause automated posting" : "Resume automated posting"}
              >
                {configs.Facebook.IsActive ? 'Disable' : 'Enable'}
              </button>
            </div>
          </div>
          <div className="sms-card-body" style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
            <p style={{ fontSize: '16px', lineHeight: '1.5' }}>
              The Prophecy Technologies Facebook page is globally configured by the administrator.<br/><br/>
              Simply <b>Enable</b> this integration to post your jobs to the official company page.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SocialMediaSettings;
