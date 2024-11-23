import React from 'react';
import '../styles/DynamicView.css';

interface DynamicViewProps {
  fields: {
    name: string;
    value: string;
  }[];
}

const DynamicView: React.FC<DynamicViewProps> = ({ fields }) => {
  return (
    <div className="container">
      {fields.map((field, index) => (
        <div key={index} className="field">
          <div className="field-content">
            <div className="field-name">{field.name}</div>
            <div className="field-value">{field.value}</div>
          </div>
          <div className="line"></div>
        </div>
      ))}
    </div>
  );
};

export default DynamicView;