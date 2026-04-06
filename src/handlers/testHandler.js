import { checkService } from "../services/index.js";
import catchAsync from "../utilis/catchAsync.js";

const checkHandler = catchAsync(async (req, res) => {
  const result = checkService();
  res.status(200).json(result);
});

export { checkHandler };

