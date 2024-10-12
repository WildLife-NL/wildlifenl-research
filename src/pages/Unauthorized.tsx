import React from 'react';

const Unauthorized: React.FC = () => {
  return (
    <div>
      <h1>Unauthorized Access</h1>
      <p>
        It seems like you don't have the <strong>Researcher</strong> role right now.
      </p>
      <p>
        If you believe this is a mistake or you should have the necessary role, please contact 
        <a href="mailto:email@example.com" > email@example.com</a> for further assistance.
      </p>
    </div>
  );
};


export default Unauthorized;
