import React, { useState } from "react";
import axios from "axios";
import { useContext } from "react";
import { RingLoader } from 'react-spinners';
import { AuthContext } from "../../states/AuthContext";
import Topbar from "../../components/topbar/Topbar";
import Sidebar from "../../components/sidebar/Sidebar";
import "./UploadPaper.css";

function UploadPaper() {
    const [summary, setSummary] = useState("");
    const [loading, setLoading] = useState(false);
    const [url, setUrl] = useState(""); // URL入力欄の状態を追加
    const { user: loginUser } = useContext(AuthContext);

    const handleUrlChange = (e) => {
        setUrl(e.target.value); // URL入力欄の変更を処理
    };

    const handleUpload = async () => {
        if (!url) {
            alert("URLを入力してください。");
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post("/api/upload/upload-paper-url", { url });
            setSummary(response.data.summary);
        } catch (error) {
            console.error("Error summarizing paper:", error);
            alert("論文の要約に失敗しました。URLが正しいか確認してください。");
            setSummary(""); // エラー時は要約をクリア
        } finally {
            setLoading(false);
        }
    };

    const handleSummaryChange = (e) => {
        setSummary(e.target.value);
    };

    const handlePost = async () => {
        if (!summary) return;
        const newPost = {
            userId: loginUser._id,
            desc: summary
        };

        try {
            await axios.post("/api/posts", newPost);
            alert("投稿が完了しました！");
        } catch (error) {
            console.error("Error posting summary:", error);
        }
    };

    return (
        <>
            <Topbar />
            <Sidebar />
            <div className="uploadPaperContainer">
                <div className="uploadPaperContent">
                    <h2 className="uploadPaperTitle">論文をアップロードして要約を投稿しよう！</h2>
                    <div className="uploadSection">
                        <input
                            type="text"
                            value={url}
                            onChange={handleUrlChange}
                            className="uploadInputUrl"
                            placeholder="arxiv の URL を入力してください"
                        />
                    </div>
                    <div className="uploadButtonContainer">
                        <button onClick={handleUpload} className="uploadButton">アップロード</button>
                        {loading && (
                            <RingLoader className="loadingSpinner" loading={loading} size={30} color="#0096b2" />
                        )}
                    </div>
                    <div className="summarySection">
                        <h3 className="summaryTitle">要約結果</h3>
                        <textarea
                            value={summary}
                            onChange={handleSummaryChange}
                            className="summaryTextArea"
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
