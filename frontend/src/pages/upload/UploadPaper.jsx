import React, { useState } from "react";
import axios from "axios";
import { useContext } from "react";
import { RingLoader } from 'react-spinners';
import { AuthContext } from "../../states/AuthContext";
import Topbar from "../../components/topbar/Topbar";
import Sidebar from "../../components/sidebar/Sidebar";
import "./UploadPaper.css";

function UploadPaper() {
    const [file, setFile] = useState(null);
    const [summary, setSummary] = useState("");
    const [loading, setLoading] = useState(false);
    const { user: loginUser } = useContext(AuthContext);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        setLoading(true);
        try {
            const response = await axios.post("/upload/upload-paper", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            setSummary(response.data.summary);
        } catch (error) {
            console.error("Error uploading paper:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSummaryChange = (e) => {
        setSummary(e.target.value);
    };

    const handlePost = async () => {
        const updatedSummary = document.querySelector(".summaryTextarea").value;
        if (!updatedSummary) return;
        const newPost = {
            userId: loginUser._id,
            desc: updatedSummary
        };

        try {
            await axios.post("/posts", newPost);
            alert("投稿が完了しました！");
        } catch (error) {
            console.error("Error posting summary:", error);
        }
    };

    return (
        <>
            <Topbar />
            <div className="uploadPaperContainer">
                <Sidebar />
                <div className="uploadPaperContent">
                    <h2 className="uploadPaperTitle">論文をアップロードして要約を投稿しよう！</h2>
                    <div className="uploadSection">
                        <input
                            id="fileInput"
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            className="uploadInput"
                        />
                    </div>
                    <button onClick={handleUpload} className="uploadButton">アップロード</button>
                    {loading && (
                        <div className="spinner-border text-primary" role="status">
                            <RingLoader className="loadingSpinner" loading={loading} size={30} color="#0096b2"/>
                        </div>
                    )}
                    <div className="summarySection">
                    <h3 className="summaryTitle">要約結果</h3>
                        <textarea
                            value={summary}
                            onChange={handleSummaryChange}
                            className="summaryTextarea"
                            placeholder="アップロードすると要約が表示されます。"
                        />
                    </div>
                    <button onClick={handlePost} className="postButton">投稿する</button>
                </div>
            </div>
        </>
    );
}

export default UploadPaper;
