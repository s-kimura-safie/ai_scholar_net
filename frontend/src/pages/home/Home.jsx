import React, { useState } from 'react';
import Topbar from "../../components/topbar/Topbar";
import Sidebar from "../../components/sidebar/Sidebar";
import Timeline from "../../components/timeline/Timeline";
import Rightbar from "../../components/rightbar/Rightbar";
import "./Home.css";

export default function Home() {
    const [selectedPaperMetadata, setSelectedPaperMetadata] = useState(null);

    return (
        <>
            <Topbar />
            <div className="homeContainer">
                <Sidebar className="sidebar" />
                <Timeline className="timeline" onMetadataSelect={setSelectedPaperMetadata} />
                <Rightbar className="rightbar" metadata={selectedPaperMetadata} />
            </div>
        </>
    );
}
