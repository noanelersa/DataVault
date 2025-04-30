import { useState, useEffect } from 'react';
import { FaExclamationCircle, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import "../styles/AlertsPage.css";

function AlertsPage({ userId }) {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setTimeout(() => {
                setAlerts([
                    {
                        severity: 3,
                        action: 'DELETE',
                        file: { filename: 'report2025.docx' },
                        message: 'This file was permanently removed by admin.',
                        createdAt: new Date().toISOString()
                    },
                    {
                        severity: 2,
                        action: 'EDIT',
                        file: { filename: 'presentation.pptx' },
                        message: 'File content was modified.',
                        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()
                    },
                    {
                        severity: 1,
                        action: 'UPLOAD',
                        file: { filename: 'invoice.pdf' },
                        message: 'Upload completed successfully.',
                        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
                    }
                ]);
                setLoading(false);
            }, 500);
            return;
        }

        fetch(`http://localhost:3000/alerts?userId=${userId}&resource=file`)
            .then(res => res.ok ? res.json() : [])
            .then(data =>
                setAlerts(
                    data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                )
            )
            .catch(() => setAlerts([]))
            .finally(() => setLoading(false));
    }, [userId]);

    const getIcon = (severity) => {
        if (severity === 3) return <FaExclamationCircle size={24} color="#c0392b" />;
        if (severity === 2) return <FaExclamationTriangle size={24} color="#e67e22" />;
        return <FaInfoCircle size={24} color="#2980b9" />;
    };

    const formatTimestamp = (ts) => {
        const date = new Date(ts);
        if (isNaN(date)) return "Invalid date";
        return date.toLocaleString('en-GB', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatAction = (action) => {
        if (!action) return '';
        return action.charAt(0).toUpperCase() + action.slice(1).toLowerCase();
    };

    if (!userId && alerts.length === 0 && !loading) {
        return <div className="alerts-empty">No mock alerts to display.</div>;
    }

    if (loading) {
        return <div className="alerts-loading">Loading alerts...</div>;
    }

    return (
        <div className="alerts-container">
            {alerts.map((alert, index) => (
                <div key={index} className="alert-card">
                    <div className="alert-icon">{getIcon(alert.severity)}</div>
                    <div className="alert-content">
                        <div className="alert-message">
                            {formatAction(alert.action)} on <strong>{alert.file?.filename || 'Unnamed file'}</strong>
                        </div>
                        {alert.message && (
                            <div className="alert-subtext">{alert.message}</div>
                        )}
                        <div className="alert-time">{formatTimestamp(alert.createdAt)}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default AlertsPage;
