import Enrollment from "../models/Enrollment.js";

export async function enrollContact(req, res) {
  try {
    const { contactId, campaignId } = req.body;

    const enrollment = await Enrollment.create({
      contactId,
      campaignId,
      currentStep: 1,
      nextSendAt: new Date(),
      status: "active",
    });

    res.json(enrollment);
  } catch (error) {
    res.status(500).json({ message: "Enrollment failed" });
  }
}

export async function getEnrollments(req, res) {
  try {
    const items = await Enrollment.find()
      .populate("contactId", "fullName phone normalizedPhone")
      .populate("campaignId", "name steps")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ items });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch enrollments" });
  }
}

export async function getEnrollmentByContact(req, res) {
  try {
    const { contactId } = req.params;

    const item = await Enrollment.findOne({ contactId })
      .populate("campaignId", "name steps")
      .sort({ createdAt: -1 })
      .lean();

    if (!item) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    res.json(item);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch enrollment" });
  }
}