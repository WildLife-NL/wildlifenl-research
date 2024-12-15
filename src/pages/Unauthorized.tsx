const Unauthorized: React.FC = () => {
  return (
    <div>
      <h1>Unauthorized Access</h1>
      <p>
        It seems like you don't have the <strong>Researcher</strong> role right now.
      </p>
      <p>
        If you believe this is a mistake or you should have the necessary role,
        please contact the organization
      </p>
    </div>
  );
};


export default Unauthorized;
