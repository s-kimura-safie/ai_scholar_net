import React, { useState } from 'react';
import Topbar from "../../components/topbar/Topbar";
import Sidebar from "../../components/sidebar/Sidebar";
import RightBar from "../../components/rightbar/Rightbar";
import Timeline from '../../components/timeline/Timeline';
import "./LikedPosts.css";

function LikedPosts() {
    const [selectedPaperMetadata, setSelectedPaperMetadata] = useState(null);

    return (
        <>
            <Topbar />
            <div className="likedPostsContainer">
                <Sidebar />
                <Timeline onMetadataSelect={setSelectedPaperMetadata} showLikedPosts={true} />
                <RightBar metadata={selectedPaperMetadata} />
            </div>
        </>
    );
}

export default LikedPosts;
