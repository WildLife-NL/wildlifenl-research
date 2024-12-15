import React, { useRef, useEffect } from 'react';
import '../styles/QuestionSelectionPopup.css';

interface QuestionSelectionPopupProps {
  onClose: () => void;
  onSelectType: (type: 'single' | 'multiple') => void;
}

const QuestionSelectionPopup: React.FC<QuestionSelectionPopupProps> = ({ onClose, onSelectType }) => {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [onClose]);

  const handleSingleClick = () => {
    console.log("Single Answer clicked");
    onSelectType('single');
    onClose();
  };

  const handleMultipleClick = () => {
    console.log("Multiple Choice clicked");
    onSelectType('multiple');
    onClose();
  };

  return (
    <div className="popup-overlay">
      <div className="Popup-container" ref={popupRef}>
        <div className="Multiplechoicerectangle" onClick={handleMultipleClick}></div>
        <div className="Seperationline"></div>
        <div className="Singleanswerheader"></div>
        <div className="Multiplechoiceheader"></div>
        <div className="Singleanswer">Single Answer</div>
        <div className="Multiplechoicetext">Multiple Choice</div>
        <div className="Singleanswerrectangle" onClick={handleSingleClick}></div>

        <div className="Singleanswersvg">
          <img
            src={'../assets/SingleAnswerSVG.svg'}
            alt="Single Answer"
            style={{ width: '100%', height: 'auto' }}
            onClick={handleSingleClick}
          />
        </div>

        <div className="Multiplechoicesvg">
          <img
            src={'../assets/MultipleChoiceSVG.svg'}
            alt="Multiple Choice"
            style={{ width: '100%', height: 'auto' }}
            onClick={handleMultipleClick}
          />
        </div>
      </div>
    </div>
  );
};

export default QuestionSelectionPopup;
