import React from 'react';
import './SupportModal.css';

interface SupportModalProps {
  onClose: () => void;
}

const SupportModal: React.FC<SupportModalProps> = ({ onClose }) => {
  // QR Code image từ public folder
  const qrCodeUrl = '/support_qr.jpg';

  return (
    <div className="support-modal-overlay" onClick={onClose}>
      <div className="support-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="support-modal-close" onClick={onClose}>
          ✕
        </button>
        
        <div className="support-modal-header">
          <div className="support-icon">🥛🥛🥛</div>
          <h2>Buying miku a Milkkkkkkkiiuu</h2>
        </div>

        <div className="support-modal-body">
          <p className="support-message">
            Nếu MikuHan giúp bạn học tốt hơn, hãy thưởng cho Miku một hộp sữa để Miku có thêm sức mạnh phát triển dự án nhé! (✿◠‿◠)
          </p>

          <div className="qr-code-container">
            <img 
              src={qrCodeUrl} 
              alt="Quét mã này để gửi yêu thương cho Miku nè! (っ◕‿◕)っ" 
              className="qr-code-image"
              onError={(e) => {
                // Fallback nếu không tìm thấy QR code
                console.error('Không thể tải QR code. Vui lòng đảm bảo file support_qr.jpg có trong thư mục public.');
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>

          <p className="support-thanks">
            Cảm ơn bạn đã luôn ở bên cạnh Miku! Arigatooo! (´｡• ᵕ •｡`) ♡
          </p>
        </div>
      </div>
    </div>
  );
};

export default SupportModal;

