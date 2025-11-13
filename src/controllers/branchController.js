import Branch from "../models/branchModel.js";

export const createBranch = async (req, res) => {
  try {
    const branch = await Branch.create(req.body);
    res.status(201).json({ message: "Branch created", branch });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBranches = async (req, res) => {
  try {
    const branches = await Branch.find({ orgId: req.body.orgId })
      .populate('managerId', 'firstName lastName eId')
      .sort({ createdAt: -1 });
    res.status(200).json({ branches });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateBranch = async (req, res) => {
  try {
    const branch = await Branch.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(200).json({ message: "Branch updated", branch });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
