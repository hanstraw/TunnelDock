import React from 'react';

interface ConfirmDialogProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ title, message, onConfirm, onCancel }) => {
  return (
    <div className="dialog-overlay">
      <div className="dialog">
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="dialog-actions">
          <button onClick={onCancel}>取消</button>
          <button className="danger" onClick={onConfirm}>确认</button>
        </div>
      </div>
    </div>
  );
};
