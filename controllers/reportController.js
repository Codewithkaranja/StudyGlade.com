// reportController.js
export const getReports = async (req, res) => {
  try {
    // your logic here
    res.json({ message: "Reports fetched successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
