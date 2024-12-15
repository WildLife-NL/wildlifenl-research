import '../styles/DynamicView.css';

interface DynamicViewProps {
  fields: {
    name: string;
    value: string;
  }[];
}

const DynamicView: React.FC<DynamicViewProps> = ({ fields }) => {
  return (
    <div className="dynamic-view-container">
      {fields.map((field, index) => (
        <div key={index} className="dynamic-view-field">
          <div className="dynamic-view-field-content">
            <div className="dynamic-view-field-name">{field.name}</div>
            <div className="dynamic-view-field-value">{field.value}</div>
          </div>
          <div className="dynamic-view-line"></div>
        </div>
      ))}
    </div>
  );
};

export default DynamicView;