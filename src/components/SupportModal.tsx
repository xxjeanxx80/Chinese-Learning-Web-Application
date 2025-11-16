import React from 'react';
import './SupportModal.css';

interface SupportModalProps {
  onClose: () => void;
}

const SupportModal: React.FC<SupportModalProps> = ({ onClose }) => {
  // QR Code image từ public folder
  const qrCodeUrl = '/qr-code.jpg';

  return (
    <div className="support-modal-overlay" onClick={onClose}>
      <div className="support-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="support-modal-close" onClick={onClose}>
          ✕
        </button>
        
        <div className="support-modal-header">
          <div className="support-icon">☕️❤️</div>
          <h2>Mời tôi một cốc cà phê</h2>
        </div>

        <div className="support-modal-body">
          <p className="support-message">
            Nếu trang web hữu ích, hãy ủng hộ để tôi tiếp tục duy trì và phát triển dự án.
          </p>

          <div className="qr-code-container">
            <img 
              src={qrCodeUrl} 
              alt="QR Code thanh toán" 
              className="qr-code-image"
              onError={(e) => {
                // Fallback nếu không tìm thấy QR code
                console.error('Không thể tải QR code. Vui lòng đảm bảo file qr-code.jpg có trong thư mục public.');
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>

          <p className="support-thanks">
            Cảm ơn bạn đã đồng hành cùng dự án! 🙏
          </p>
        </div>
      </div>
    </div>
  );
};

export default SupportModal;

