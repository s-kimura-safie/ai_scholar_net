import mongoose from "mongoose";

const PaperSchema = new mongoose.Schema({
    paperId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    authors: { type: [String], required: true },
    year: { type: Number, required: true },
    abstract: { type: String },
    fieldsOfStudy: { type: [String] },
    venue: { type: String },
    citationCount: { type: Number },
    referenceCount: { type: Number },
    url: { type: String, required: true },
    pdfPath: { type: String },
});

const Paper = mongoose.model("Paper", PaperSchema);
export default Paper;
