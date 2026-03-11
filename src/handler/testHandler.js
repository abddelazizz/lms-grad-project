import { checkService } from "../services/index.js";

const checkHandler = (req, res) => {
  const result = checkService();
  res.status(200).json(result);
};

export { checkHandler };
