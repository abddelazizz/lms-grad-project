const checkService = () => {
  return {
    success: true,
    message: "Node server and Docker DB are talking!",
    timestamp: new Date(),
  };
};

export { checkService };
